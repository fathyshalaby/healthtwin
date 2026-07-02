# What's Missing

An honest map of what is **not** yet done. Phases 1–5 are built and tested, but "built and
tested against fakes" ≠ "production-ready product." This is the gap list.

> An independent multi-agent audit refines and re-prioritizes this list; the latest synthesis
> is appended at the bottom when available.

## Recommended next 3 moves

1. **Apply the Supabase schema and verify sync live** (S) — the whole cloud story is untested against a real DB. `packages/supabase/schema.sql` → SQL editor → run the live round-trip test.
2. **Add CI** (S) — a GitHub Action running `pnpm -w test` + the Playwright E2E on every push, so the green suite is enforced publicly.
3. **Replace placeholder body art** (M) — the ~12 rectangles are the single most obvious "this is a prototype" tell; licensed anatomical SVG paths make it real.

## 1. Blocking a real MVP

- **Real anatomical body-map art** (M) — regions are placeholder rects in `bodymap-core/geometry.ts`; needs licensed SVG paths + more regions.
- **Live Supabase not verified** (S) — schema unapplied; adapter/RLS only contract-tested against mocks.
- **Web auth is thin** (M) — magic-link only; no sign-out, session refresh handling, or auth callback route in `apps/web`.
- **No edit/delete in the UI** (M) — the model supports supersede/tombstone, but no UI exercises it.
- **Consent/sharing has no UI** (M) — RLS + `consent_grants` exist; nothing lets a user actually grant/revoke access to a clinician.

## 2. Needed before real users / partners (production hardening)

- **CI/CD** (S) — no GitHub Actions; tests aren't enforced on PRs.
- **npm publishing + versioning** (M) — packages are `0.0.0`, unpublished; no changesets/release flow.
- **Embed bundle** (M) — `embed.html` references `embed.bundle.js` that no build produces yet (needs tsup/vite).
- **Partner token-exchange server** (M) — only the client `exchangePartnerToken` helper exists; the verifying endpoint is unbuilt.
- **`partner_id` multi-tenancy** (M) — needed to isolate partner user pools; not in the schema/RLS yet.
- **Column-level `note` encryption** (M) — documented (pgcrypto), not implemented.
- **GDPR/HIPAA operational bits** (L) — DSAR export + erasure job, BAA/DPA, data-residency choice.
- **Sync UX** (M) — no online/offline indicator, retry/backoff surfacing, or conflict/error states in the UI.
- **Native app is unverified** (M) — data layer is tested; the Expo screens have zero runtime tests and haven't run on a device.
- **Observability** (S) — no logging/error tracking (Sentry-style) anywhere.

## 3. Nice-to-have / later

- **Vitals (BP/HR), mood/daily check-in, activity/PT logging** — deliberately deferred in Phase 1.
- **AI insights/processing engine** — the "process the data for partners" pitch; not started.
- **Doctor/provider portal** — the clinician-facing weekly review app.
- **Wearable / Apple HealthKit / Google Fit ingestion** — the automatic-data subsystem.
- **Landing/marketing page** — to pitch the SDK.
- **Theming API for partners** — beyond the current minimal styling.
- **i18n**, posterior-view UX polish, region-tap → timeline filtering, richer empty states.
- **Docs site / API reference / partner starter template.**
