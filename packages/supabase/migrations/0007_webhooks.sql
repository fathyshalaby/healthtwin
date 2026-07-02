-- Partner webhooks: POST each new observation to a partner-configured endpoint,
-- HMAC-signed over the exact JSON body. Uses pg_net (async HTTP) + pgcrypto (hmac).
-- The signed bytes are jsonb::text (canonical), which equals what pg_net sends, so
-- a receiver verifies with verifyWebhookSignature against the raw request body.
create extension if not exists pg_net;
create extension if not exists pgcrypto;

create table if not exists public.partner_webhooks (
  partner_id text primary key,
  url        text not null,
  secret     text not null,
  active     boolean not null default true
);
alter table public.partner_webhooks enable row level security;  -- service-role only; no policies

create or replace function public.dispatch_observation_webhook() returns trigger
  language plpgsql security definer set search_path = public as $$
declare
  hook public.partner_webhooks%rowtype;
  body jsonb;
  sig  text;
begin
  if new.partner_id is null then return new; end if;
  select * into hook from public.partner_webhooks where partner_id = new.partner_id and active;
  if not found then return new; end if;

  body := jsonb_build_object(
    'type', 'observation.created',
    'partnerId', new.partner_id,
    'observation', jsonb_build_object(
      'id', new.id, 'subjectId', new.subject_id, 'occurredAt', new.occurred_at, 'type', new.type
    )
  );
  sig := 'sha256=' || encode(hmac(body::text, hook.secret, 'sha256'), 'hex');

  perform net.http_post(
    url := hook.url,
    body := body,
    headers := jsonb_build_object('content-type', 'application/json', 'x-healthtwin-signature', sig)
  );
  return new;
end;
$$;

drop trigger if exists observations_webhook on public.observations;
create trigger observations_webhook
  after insert on public.observations
  for each row execute function public.dispatch_observation_webhook();
