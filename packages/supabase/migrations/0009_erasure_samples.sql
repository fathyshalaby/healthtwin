-- 0009: extend GDPR Art. 17 erasure to wearable vitals. purge_subject() is
-- redefined here (not in 0006) because the samples table doesn't exist until
-- 0008 — a `language sql` function validates its body against existing objects
-- at CREATE time, so referencing public.samples earlier would fail.
create or replace function public.purge_subject(target uuid) returns void
  language sql security definer set search_path = public as $$
    delete from public.observations where subject_id = target;
    delete from public.samples where subject_id = target;
    delete from public.consent_grants where grantor = target or grantee = target;
    delete from public.audit_log where subject_id = target;
$$;
revoke all on function public.purge_subject(uuid) from public, anon, authenticated;
