-- Consent grants: explicit, scoped, time-boxed, revocable sharing.
create table if not exists public.consent_grants (
  id          uuid primary key default gen_random_uuid(),
  grantor     uuid not null,                 -- the subject sharing their data
  grantee     uuid not null,                 -- who may read it (e.g. a clinician)
  scope       text not null default 'all',   -- 'all' or a specific regionId
  expires_at  timestamptz,                   -- null = no expiry
  revoked     boolean not null default false,
  created_at  timestamptz not null default now()
);

create index if not exists consent_grants_grantee on public.consent_grants (grantee);

alter table public.consent_grants enable row level security;

create policy grants_select_involved on public.consent_grants
  for select using (grantor = auth.uid() or grantee = auth.uid());

create policy grants_insert_own on public.consent_grants
  for insert with check (grantor = auth.uid());

-- Grantor may revoke (update) their own grants.
create policy grants_update_own on public.consent_grants
  for update using (grantor = auth.uid());

-- Grantees may read observations they've been granted, within scope and time.
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
