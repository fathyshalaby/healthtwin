-- 0008: vitals / activity samples (wearable ingestion) — append-only time-series,
-- distinct from symptom observations but sharing the same RLS + consent model.

create table if not exists public.samples (
  id          text primary key,
  subject_id  uuid not null,
  kind        text not null,
  value       double precision not null,
  unit        text not null,
  at          timestamptz not null,
  source      text not null,
  partner_id  text default (auth.jwt() ->> 'partner_id'),
  seq         bigint generated always as identity,
  synced_at   timestamptz not null default now()
);
create index if not exists samples_subject_seq on public.samples (subject_id, seq);
create index if not exists samples_subject_kind_at on public.samples (subject_id, kind, at);
create index if not exists samples_partner on public.samples (partner_id);

alter table public.samples enable row level security;

create policy samples_select_own on public.samples
  for select using (subject_id = auth.uid());
create policy samples_insert_own on public.samples
  for insert with check (subject_id = auth.uid());

-- Grantees with an 'all'-scope consent grant can read the subject's samples.
-- (Region-scoped grants don't apply to vitals, so only 'all' shares them.)
create policy samples_select_granted on public.samples
  for select using (
    exists (
      select 1 from public.consent_grants g
      where g.grantee = auth.uid()
        and g.grantor = samples.subject_id
        and g.revoked = false
        and (g.expires_at is null or g.expires_at > now())
        and g.scope = 'all'
    )
  );
