-- HealthTwin schema — paste into the Supabase SQL Editor and Run.
-- Combines migrations 0001–0003 (observations + RLS, consent_grants, audit).

-- ── 0001: observations (append-only, immutable) ──────────────────────────────
create table if not exists public.observations (
  id              text primary key,
  subject_id      uuid not null,
  occurred_at     timestamptz not null,
  created_at      timestamptz not null,
  location        jsonb not null,
  type            text not null,
  quality         text[],
  intensity       int check (intensity between 0 and 10),
  note            text,
  context_tags    text[],
  taxonomy_version text not null,
  supersedes      text,
  tombstone       boolean,
  origin          text not null,
  seq             bigint generated always as identity,
  synced_at       timestamptz not null default now()
);
create unique index if not exists observations_seq_uk on public.observations (seq);
create index if not exists observations_subject_seq on public.observations (subject_id, seq);

alter table public.observations enable row level security;

create policy observations_select_own on public.observations
  for select using (subject_id = auth.uid());
create policy observations_insert_own on public.observations
  for insert with check (subject_id = auth.uid());

-- ── 0002: consent grants (scoped, time-boxed, revocable sharing) ─────────────
create table if not exists public.consent_grants (
  id          uuid primary key default gen_random_uuid(),
  grantor     uuid not null default auth.uid(),
  grantee     uuid not null,
  scope       text not null default 'all',
  expires_at  timestamptz,
  revoked     boolean not null default false,
  created_at  timestamptz not null default now()
);
create index if not exists consent_grants_grantee on public.consent_grants (grantee);

alter table public.consent_grants enable row level security;

create policy grants_select_involved on public.consent_grants
  for select using (grantor = auth.uid() or grantee = auth.uid());
create policy grants_insert_own on public.consent_grants
  for insert with check (grantor = auth.uid());
create policy grants_update_own on public.consent_grants
  for update using (grantor = auth.uid());

create policy observations_select_granted on public.observations
  for select using (
    exists (
      select 1 from public.consent_grants g
      where g.grantee = auth.uid()
        and g.grantor = observations.subject_id
        and g.revoked = false
        and (g.expires_at is null or g.expires_at > now())
        and (g.scope = 'all' or g.scope = (observations.location ->> 'regionId'))
    )
  );

-- ── 0003: audit log (write-auditing via trigger) ─────────────────────────────
create table if not exists public.audit_log (
  id          bigint generated always as identity primary key,
  actor       uuid,
  action      text not null,
  subject_id  uuid,
  record_id   text,
  at          timestamptz not null default now()
);
alter table public.audit_log enable row level security;
create policy audit_select_own on public.audit_log
  for select using (actor = auth.uid());

create or replace function public.log_observation_insert() returns trigger as $$
begin
  insert into public.audit_log (actor, action, subject_id, record_id)
  values (auth.uid(), 'observation.insert', new.subject_id, new.id);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists observations_audit_insert on public.observations;
create trigger observations_audit_insert
  after insert on public.observations
  for each row execute function public.log_observation_insert();

-- ── 0004: partner (tenant) tagging ───────────────────────────────────────────
alter table public.observations
  add column if not exists partner_id text default (auth.jwt() ->> 'partner_id');
create index if not exists observations_partner on public.observations (partner_id);

-- ── 0005: note encryption helpers (pgcrypto, opt-in) ─────────────────────────
create extension if not exists pgcrypto;
create or replace function public.note_key() returns text
  language sql stable as $$ select current_setting('app.note_key', true) $$;
create or replace function public.encrypt_note(plain text) returns text
  language sql as $$ select case when plain is null then null else armor(pgp_sym_encrypt(plain, public.note_key())) end $$;
create or replace function public.decrypt_note(cipher text) returns text
  language sql as $$ select case when cipher is null then null else pgp_sym_decrypt(dearmor(cipher), public.note_key()) end $$;

-- ── 0006: GDPR Art. 17 hard erasure (service-role only) ──────────────────────
create or replace function public.purge_subject(target uuid) returns void
  language sql security definer set search_path = public as $$
    delete from public.observations where subject_id = target;
    delete from public.consent_grants where grantor = target or grantee = target;
    delete from public.audit_log where subject_id = target;
$$;
revoke all on function public.purge_subject(uuid) from public, anon, authenticated;

-- ── 0007: partner webhooks (pg_net + pgcrypto) ──────────────────────────────
create extension if not exists pg_net;
create table if not exists public.partner_webhooks (
  partner_id text primary key, url text not null, secret text not null, active boolean not null default true
);
alter table public.partner_webhooks enable row level security;  -- service-role only
create or replace function public.dispatch_observation_webhook() returns trigger
  language plpgsql security definer set search_path = public as $$
declare hook public.partner_webhooks%rowtype; body jsonb; sig text;
begin
  if new.partner_id is null then return new; end if;
  select * into hook from public.partner_webhooks where partner_id = new.partner_id and active;
  if not found then return new; end if;
  body := jsonb_build_object('type','observation.created','partnerId',new.partner_id,
    'observation', jsonb_build_object('id',new.id,'subjectId',new.subject_id,'occurredAt',new.occurred_at,'type',new.type));
  sig := 'sha256=' || encode(hmac(body::text, hook.secret, 'sha256'), 'hex');
  perform net.http_post(url := hook.url, body := body,
    headers := jsonb_build_object('content-type','application/json','x-healthtwin-signature', sig));
  return new;
end; $$;
drop trigger if exists observations_webhook on public.observations;
create trigger observations_webhook after insert on public.observations
  for each row execute function public.dispatch_observation_webhook();
