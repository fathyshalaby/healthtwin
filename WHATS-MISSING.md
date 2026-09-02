# What's missing — current inventory (2026-09-02)

> Honest gap list against **what is in `main` today**, not the 2026-07-02 hardening notes.
> Those notes are **historical**: most “blocking MVP” items there (CI, tsup builds, edit/delete, back view, review filters, embed origin allowlist, consent API, partner JWT, landing, insights, wearables *mapping*) are already shipped.
>
> **Verdict:** the **local-first web loop is a real, correctly designed alpha**. Cloud, compliance, partner SDK publish, and live wearables are **scaffolding and marketing**, not a production product.

Merged into `main` since this inventory was first written:

- [#17](https://github.com/fathyshalaby/healthtwin/pull/17) — embed SSR crash, larger tap targets, embed/theme e2e
- [#19](https://github.com/fathyshalaby/healthtwin/pull/19) — this gap-list rewrite + small correctness fixes

Still open:

- [#20](https://github.com/fathyshalaby/healthtwin/pull/20) — this branch: native App SDKs, clinician report, git-root Next so Vercel can build without the illegal `rootDirectory` key

---

## How it is implemented (and whether that is correct)

The architecture is the right one for this product. The bugs are mostly **unfinished edges and overclaimed surfaces**, not a wrong data model.

| Layer | How it works | Correct? |
|---|---|---|
| **Observation log** | One capture = one immutable row. Edit appends a record with `supersedes`; delete appends `tombstone`. `foldLog` hides superseded + tombstoned rows. Zod + ULID in `@healthtwin/core`. | **Yes.** This is the right clinical/sync model. |
| **Local store** | Web: IndexedDB (`createIdbStore`). Native Expo: SQLite via `SqlDb` seam. Memory store for tests. | **Yes** for local-first. |
| **Sync** | `runSync` pushes unsynced ids, then pulls one page (`seq` cursor, 500 rows). Idempotent because ids are unique. | **Mostly.** Happy-path is correct. Provider now swallows adapter errors so a down backend cannot drop a local capture. Still no backoff; pull is single-page so a large backlog needs many ticks. |
| **Body map** | Geometric SVG (ellipses + rounded rects) in `@healthtwin/bodymap-core`; React paints paths; native re-paints the same `d` via `react-native-svg`. | **Yes as a stylized figure.** Invisible hit stroke is 20 user-units (PR #17). Not clinical art. |
| **Capture UI** | Tap region → `EntrySheet` (type, quality chips, 0–10, time, note, tags) → `add()`. Entries list can edit/delete. Front/Back toggle. | **Yes** on web. Expo capture has type/quality/intensity, no note/time/tags/edit. |
| **Review** | `ReviewPanel`: view toggle, 7d/30d/all, heatmap metric, tap-region filters timeline. | **Yes.** |
| **Insights** | `summarize()` + `templateNarrator()` run **on-device** over IndexedDB. “Seed a demo week” writes correlated knee pain + sleep/steps. Cloud `/api/insights` can use Claude if `ANTHROPIC_API_KEY` is set. | **Engine is real.** UI insights do **not** call the API. Correlation is Pearson-style over seeded/local samples, not a live wearable. |
| **Partner page** | Renders `cohortSummary(demoCohort(42))` — **synthetic**. Real tenant analytics live at `GET /api/partner/analytics` (service role + partner JWT) and are unused by this page. | **Demo is honest** (`demo · synthetic cohort`). Do not treat the dashboard as live. |
| **Embed** | Custom element wraps React capture, emits `healthtwin:observation` + origin-pinned `postMessage`. | **Contract is correct.** PR #17: dynamic import on `/embed` + SSR-safe `HTMLElement` fallback. |
| **Cloud / RLS** | SQL migrations exist (observations, consent, audit, partner, pgcrypto helpers, purge, samples, webhooks). Web switches to magic-link + `createCloudAdapter` when `NEXT_PUBLIC_SUPABASE_*` is set. | **Designed correctly, unverified live.** `live.test.ts` and RLS-denial tests skip without env. CI does not run Supabase. |
| **Share / consent** | `/share` can create/list/revoke grants **in cloud mode** (now in the nav). Grantor-update policy has `USING` but no `WITH CHECK`. Granted-select does not hide tombstones. | **Plumbing yes, product no.** |
| **GDPR export/erase** | `GET /api/export` and `POST /api/erase` (service-role `purge_subject`). No in-app buttons. Export now stamps `exportedAt`. This branch also downloads a local JSON twin from the data bar. | **API stubs, not a user flow.** |
| **Vitals / wearables** | `@healthtwin/vitals` maps HealthKit / Google Fit **record shapes** → samples. No HealthKit/Google Fit SDK, no device permission, no background ingest. | **Mapper is correct. Landing copy overclaims.** |
| **Auth session** | Cloud: one `currentUserId()` on mount. No `onAuthStateChange`, no sign-out in the UI. Badge is `THIS DEVICE` vs `CLOUD` on this branch. | **Incomplete** for a shared-device health app. |
| **Expo app** | 3 tabs (Capture / Review / Insights), SQLite, local only, excluded from the pnpm workspace (`!apps/native`). | **Scaffold is real. Zero runtime/CI tests.** |
| **Packages** | tsup ESM+CJS+`.d.ts`, `exports`, `publishConfig`, v0.1.0. Nothing is on npm. | **Buildable, unpublished.** |

---

## 1. Built and correct (the actual product)

These match the README promise for a **local-first alpha**:

- Tap a body region (anterior **or** posterior, including lower back) → log type / quality / intensity / note / time / tags.
- Persist in IndexedDB; survive reload.
- Edit / delete via supersede / tombstone; folded list is the live twin.
- Review heatmap (frequency / intensity / recency) + date window + region→timeline.
- Dark mode (`ht-theme` + FOUC-prevention script).
- Insights: on-device summary + template narrative + correlation view (with demo seed).
- Embed custom element + origin-pinned events (client-side).
- Unit tests across packages + Playwright specs (capture, review, edit/delete, posterior, embed, theme; this branch adds clinician report).
- GitHub Actions: `pnpm` build + test + Playwright.
- Package builds via tsup (installable **from the repo**, not npm).

---

## 2. Implemented but not production-correct

### Cloud path is unproven

- No live Supabase in CI. `packages/supabase/src/live.test.ts` is `skipIf(!live)`.
- RLS is the sole PHI boundary and is **not** exercised on every commit.
- `HealthTwinProvider` sync now swallows adapter errors so a down backend cannot drop a local capture. Still **no backoff**.
- `runSync` pulls **one page**. Fine for demos; not a full catch-up.
- App chrome on this branch says **THIS DEVICE** vs **CLOUD**. Still no sign-out, no `onAuthStateChange`.

### Privacy / compliance claims overreach

Landing: “HIPAA / GDPR-aware”. README: RLS, consent, audit, pgcrypto.

What is actually true:

- **RLS SQL exists** (owner-only + grant-based select). Not live-verified in CI.
- **Consent grants** exist as SQL + `/share` UI + API helpers. No clinician portal that *reads* a grant.
- **Audit** logs observation **inserts** only — not reads, shares, or exports.
- **pgcrypto** helpers exist; **not** wired as a default write trigger. Notes are plaintext unless you opt in.
- **`/api/erase`** hard-deletes for the authed uid via service role — no UI, no backup story, no samples-only confirmation.
- **`/api/export`** returns observations JSON — no vitals, no in-app download.
- No BAA/DPA, no `SECURITY.md`, no EU residency, no capture-consent screen before first log.
- `grants_update_own` has no `WITH CHECK` (grantor can mutate grantee/scope after insert).
- `observations_select_granted` does not filter tombstones (deleted rows still flow to a clinician).

Treat “HIPAA/GDPR” as **design intent**, not a verified posture.

### Insights / partner / wearables are engines + demos

- Insights **page** = local `summarize` + template narrator. Claude only on `/api/insights` with a key.
- Partner **page** = seeded RNG cohort. `/api/partner/analytics` is the real (unwired) path.
- Wearables = `fromHealthKit` / `fromGoogleFit` mappers + IDB sample store. Landing “HealthKit and Google Fit map straight into the record” is **not** a shipping integration.
- No doctor portal. No SaMD/AI-Act packaging.

### Embed / geometry (PR #17, now on `main`)

- `/embed` dynamically imports the custom element; `HealthTwinCaptureElement` falls back when `HTMLElement` is missing.
- Invisible hit stroke is 20 user-units so small joints stay tappable.
- `next.config.mjs` transpiles `@healthtwin/embed` / `insights` / `vitals` / `ratelimit`.
- e2e covers embed events and theme persist.

### Native (Expo)

- Capture / Review / Insights tabs exist.
- Provider is **add-only**, local SQLite, **no SyncAdapter**.
- No note / occurredAt / context tags / edit / delete on capture.
- `apps/native` is excluded from the workspace; CI never runs it; no simulator tests.

### Product chrome

- Landing “See the live demo” → GitHub unless `NEXT_PUBLIC_APP_URL` is set.
- Vercel Git deploys failed because the Next app lives in `apps/web` and `rootDirectory` is not a valid `vercel.json` key. This branch adds a root `next.config.mjs` + `app`/`src` symlinks so the builder can see Next at the git root. (`main` added a root `vercel.json` with the illegal `rootDirectory` key; this branch keeps the git-root Next layout instead.)
- README on this branch lists Flutter / Swift / Kotlin and the clinician report; `main` still under-describes those.
- Test badge on `main` says “60 unit + 6 e2e”; this branch also runs native SDK jobs + a report spec.
- Packages not published to npm; no changesets.
- No ESLint/Prettier in CI. No i18n. No visual regression on the figure.
- Geometric body, not licensed anatomy.

---

## 3. Still actually missing (do these next)

Ordered by “can a partner or a real user trust this?”

1. **Prove the cloud boundary** — local Supabase (or a staging project) in CI: two-user RLS denial, consent expiry/revoke, tombstone hidden from grantee, live push/pull.
2. **Session + account** — `onAuthStateChange`, sign-out, consent-to-capture before first log, in-app export + erase.
3. **Publish or stop claiming an npm SDK** — changesets + a 0.1.0 to npm, or mark packages `private` until then.
4. **Native parity** — either wire Expo to `SyncAdapter` + edit/delete, or stop listing it as a product surface. Flutter/Swift/Kotlin (this branch) still need a shared id scheme (real ULIDs) before they can sync with web.
5. **Honest marketing** — drop “HIPAA / GDPR-aware” and “HealthKit/Google Fit” until those paths are live; point the landing demo at the app URL.
6. **Doctor / partner read path** — a clinician view that consumes a grant (the grant table is useless without a reader). `/report` on this branch is a local print-PDF handoff, not live grant read.
7. **Governance** — `SECURITY.md`, disclosure address, DPA/BAA templates if anyone will process PHI.

Nice-to-have (not blocking an honest alpha): i18n, screenshot tests, coverage thresholds, lint, HealthKit/Fit adapters, clinical illustration, Shadow DOM theming, api-extractor public API.

---

## 4. What the 2026-07-02 list got wrong

Do **not** use the old “Recommended next 3 moves” (installable packages / CI / edit-delete / back view). Those shipped. Remaining items from that era that are **still true**: live RLS, sign-out, onboarding consent, npm publish, native runtime tests, operational compliance, lint, `SECURITY.md`.
