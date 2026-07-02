-- Partner (tenant) tagging. partner_id is derived from the session's JWT claim, so
-- a client cannot spoof it. Owner-scoping RLS (subject_id = auth.uid()) still applies;
-- this adds tenant attribution + enables partner-level analytics/queries.
alter table public.observations
  add column if not exists partner_id text default (auth.jwt() ->> 'partner_id');

create index if not exists observations_partner on public.observations (partner_id);

-- Enforce that partner_id matches the JWT claim on insert, so a client cannot
-- spoof another tenant's id by supplying it explicitly (the column DEFAULT only
-- applies when partner_id is omitted). Recreate the insert policy with the check.
drop policy if exists observations_insert_own on public.observations;
create policy observations_insert_own on public.observations
  for insert with check (
    subject_id = auth.uid()
    and partner_id is not distinct from (auth.jwt() ->> 'partner_id')
  );
