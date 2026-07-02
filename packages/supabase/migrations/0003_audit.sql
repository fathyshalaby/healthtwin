-- Append-only audit log. Write-auditing via triggers; read-auditing needs
-- pgaudit or application-level logging (see README).
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
