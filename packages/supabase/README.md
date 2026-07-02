# @healthtwin/supabase

Reference cloud backend for the HealthTwin `SyncAdapter`. Swap it out by implementing
`SyncAdapter` from `@healthtwin/core` against any backend.

## What's here

- `createCloudAdapter(client)` — `SyncAdapter` over `@supabase/supabase-js` (push = idempotent upsert, pull = `seq`-cursored page).
- `signInWithEmailOtp` / `currentUserId` / `signOut` — thin auth helpers.
- `migrations/` — SQL for the `observations` table, RLS, `consent_grants`, and an audit trigger.

## Security model (enforced by RLS)

- **Owner-only by default:** `subject_id = auth.uid()` for select and insert.
- **Immutable:** no update/delete policies — edits/deletes are new rows (supersede/tombstone).
- **Consent-based sharing:** `consent_grants` (scoped, time-boxed, revocable) grants grantees read access.
- **Audit:** every insert is logged; grantor-only visibility.

> **subjectId must equal the authenticated user's id** for RLS to permit writes. When syncing to
> the cloud, set the provider's `subjectId` to `currentUserId(client)`.

## Going live (requires either Docker or a hosted project)

**Local (needs Docker running):**
```bash
supabase init            # once
supabase start           # boots local Postgres + Auth
supabase db reset        # applies migrations/*.sql
```

**Hosted:**
```bash
supabase link --project-ref <ref>
supabase db push         # applies migrations/*.sql
```

Then provide the client with `SUPABASE_URL` + anon key and pass `createCloudAdapter(client)`
as the sync adapter.

## Follow-ups (not in this phase)

- Column-encrypt `note` with `pgcrypto` (or app-layer envelope encryption).
- Enable `pgaudit` for read-auditing (Postgres has no read triggers).
- Partner multi-tenancy: add `partner_id` scoping + a partner-token → session exchange.
