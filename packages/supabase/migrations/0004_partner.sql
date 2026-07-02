-- Partner (tenant) tagging. partner_id is derived from the session's JWT claim, so
-- a client cannot spoof it. Owner-scoping RLS (subject_id = auth.uid()) still applies;
-- this adds tenant attribution + enables partner-level analytics/queries.
alter table public.observations
  add column if not exists partner_id text default (auth.jwt() ->> 'partner_id');

create index if not exists observations_partner on public.observations (partner_id);
