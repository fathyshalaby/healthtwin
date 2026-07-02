-- GDPR Art. 17 hard erasure. The append-only design means a tombstone never
-- removes plaintext, so erasure is an explicit purge. security definer + revoked
-- from clients: only the service role (via /api/erase) may call it, for one subject.
create or replace function public.purge_subject(target uuid) returns void
  language sql security definer set search_path = public as $$
    delete from public.observations where subject_id = target;
    delete from public.consent_grants where grantor = target or grantee = target;
    delete from public.audit_log where subject_id = target;
$$;

revoke all on function public.purge_subject(uuid) from public, anon, authenticated;
