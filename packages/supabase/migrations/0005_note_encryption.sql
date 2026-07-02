-- Column-level note encryption building blocks (pgcrypto). `note` is Art. 9 free
-- text; these helpers encrypt it at rest with a server-held key.
--
-- Enabling *transparent* encryption is opt-in because it changes the read path
-- (writes call encrypt_note, reads call decrypt_note). Wire a BEFORE INSERT trigger
-- + expose reads through a decrypting view/RPC once your key management is set.
create extension if not exists pgcrypto;

-- Key from a GUC (`alter database <db> set app.note_key = '<key>'`) or Supabase Vault.
create or replace function public.note_key() returns text
  language sql stable as $$ select current_setting('app.note_key', true) $$;

create or replace function public.encrypt_note(plain text) returns text
  language sql as $$
    select case when plain is null then null
                else armor(pgp_sym_encrypt(plain, public.note_key())) end
  $$;

create or replace function public.decrypt_note(cipher text) returns text
  language sql as $$
    select case when cipher is null then null
                else pgp_sym_decrypt(dearmor(cipher), public.note_key()) end
  $$;
