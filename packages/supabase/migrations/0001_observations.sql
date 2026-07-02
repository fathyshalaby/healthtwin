-- Observations: append-only, immutable event log. One row per Observation.
create table if not exists public.observations (
  id              text primary key,                 -- ULID from the client
  subject_id      uuid not null,                     -- must equal auth.uid()
  occurred_at     timestamptz not null,
  created_at      timestamptz not null,
  location        jsonb not null,
  type            text not null,
  quality         text[],
  intensity       int check (intensity between 0 and 10),
  note            text,                               -- Art. 9 free-text; encryption helpers in 0005
  context_tags    text[],
  taxonomy_version text not null,
  supersedes      text,
  tombstone       boolean,
  origin          text not null,
  seq             bigint generated always as identity, -- monotonic pull cursor
  synced_at       timestamptz not null default now()
);

create unique index if not exists observations_seq_uk on public.observations (seq);
create index if not exists observations_subject_seq on public.observations (subject_id, seq);

alter table public.observations enable row level security;

-- Owner-only by default. Immutable: intentionally NO update/delete policies.
create policy observations_select_own on public.observations
  for select using (subject_id = auth.uid());

create policy observations_insert_own on public.observations
  for insert with check (subject_id = auth.uid());
