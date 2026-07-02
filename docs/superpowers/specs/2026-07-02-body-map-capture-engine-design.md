# Body-Map Capture Engine — Design Spec

- **Date:** 2026-07-02
- **Status:** Approved (design); pending implementation plan
- **Scope:** The shared, embeddable core capture engine for the HealthTwin platform. This is the first buildable subsystem of a larger platform (consumer app, partner SDK, AI insights, doctor portal, landing page). Only the **capture engine** is specified here.

---

## 1. Purpose & Context

HealthTwin builds a "human digital twin" — a living, structured record of what a person feels and experiences in their body over time, fusing self-reported symptoms with (later) health and activity data. The goal is that a clinician, physiotherapist, or authorized health platform can see *what actually happened* to a person across a week or month — where it hurt, how much, when, in what context — enabling better causality and care.

The **capture engine** is the shared core that both products are built on:

1. **The consumer app** (native, React Native / Expo) — a person records what they feel on the go.
2. **The partner SDK** (web) — platforms like **ColorRef** (Pilates) embed the same capture + review experience into their own product, optionally offloading storage and processing to HealthTwin.

Getting the capture engine right means the app and the SDK become largely *packaging* around it.

### Success criteria

- A user can, in under ~15 seconds, record a symptom pinned to a precise body location with type, quality, intensity, note, time, and context.
- The same body-map component renders on web and native, and can display a **heatmap** of accumulated observations plus a filterable **timeline**.
- The engine works **offline** and syncs reliably when connectivity returns, with no data loss and no merge conflicts.
- A partner can embed capture + review with a few lines of code, themed to their brand, pointing at HealthTwin's backend *or* their own.
- Health data is protected to a HIPAA/GDPR-defensible standard: isolation by default, explicit revocable sharing, full audit trail.

---

## 2. Key Decisions (locked)

| # | Decision | Choice |
|---|----------|--------|
| 1 | Focus | Core body-map capture engine (shared IP for app + SDK) |
| 2 | Body representation | 2D SVG, named front/back regions, optional fine x/y within a region |
| 3 | Delivery form | Shared TypeScript core → web SDK **and** native app (both) |
| 4 | Entry scope | Rich self-reported symptoms + context (vitals/workouts/wearables out of scope) |
| 5 | Persistence | Local-first + pluggable `SyncAdapter`; default = hosted HealthTwinCloud |
| 6 | Read surface | Included: heatmap + timeline (reuses the body map) + query API |
| 7 | Trust model | Encrypted-at-rest + strict access control (server *can* process); E2E deferred |

---

## 3. Architecture

Monorepo (pnpm workspaces + Turborepo), TypeScript throughout. The body map's geometry and logic live in the pure core; each platform gets a thin render wrapper — the anatomy's "brain" is written once, only its "pixels" twice.

```
healthtwin/
├─ packages/
│  ├─ core            # pure TS: data model, anatomy taxonomy,
│  │                  #   validation (Zod), query, sync engine. ZERO UI deps.
│  ├─ bodymap-core    # region path geometry + hit-testing + heatmap
│  │                  #   coloring math. Pure, headless.
│  ├─ bodymap-react   # web render wrapper (SVG)
│  ├─ bodymap-native  # native render wrapper (react-native-svg)
│  ├─ react           # web SDK: <HealthTwinProvider>, <BodyMapCapture/>,
│  │                  #   <BodyMapReview/>, <Timeline/>, hooks
│  └─ embed           # framework-agnostic web component / iframe for partners
├─ apps/
│  ├─ web             # Next.js (App Router, Vercel) — web app
│  ├─ native          # Expo / React Native — consumer app
│  └─ landing         # Next.js marketing/pitch site (LATER track)
└─ services/
   └─ cloud           # default backend behind the sync adapter (Supabase)
```

### Package responsibilities & boundaries

- **`core`** — the single source of truth for the domain. Owns `Observation`, the anatomy taxonomy registry, Zod schemas, the query API, and the sync engine (local store interface + outbox + adapter orchestration). No rendering, no framework, no browser assumptions. *Depends on:* nothing UI. *Used by:* everything.
- **`bodymap-core`** — headless geometry: SVG path data keyed by `(regionId, side, view)`, hit-testing (point → region), and heatmap coloring math (observations → per-region color/intensity). Pure functions, fully unit-testable without a DOM. *Depends on:* `core` (types/taxonomy). *Used by:* the render wrappers.
- **`bodymap-react` / `bodymap-native`** — thin platform render layers that consume `bodymap-core` geometry and emit interaction events. Web uses SVG; native uses `react-native-svg`. *Depends on:* `bodymap-core`, `core`.
- **`react`** — the web SDK components and hooks that compose the body map with the entry sheet, timeline, and provider/config. *Depends on:* `core`, `bodymap-react`.
- **`embed`** — a `<health-twin-capture>` web component plus an iframe fallback, for non-React or stricter-isolation partner embedding. *Depends on:* `react` (internally) but exposes a framework-agnostic surface.
- **`services/cloud`** — the reference backend (Supabase) implementing the sync + auth + consent + audit contract. Swappable via the adapter.

### Foundational technical bets

- **Immutable event log.** An `Observation` is never mutated. An edit writes a new record with `supersedes` pointing at the prior version; a delete writes a `tombstone` record. Current state = fold the log. Consequences: (a) sync is idempotent and conflict-free, (b) full audit/history for compliance, (c) doctors see true history.
- **Data-driven, versioned anatomy taxonomy.** Regions are data, not code, so the taxonomy can grow (50 → hundreds of regions) without logic changes. Each observation records the `taxonomyVersion` it was captured under so historical meaning stays stable.
- **Adapter-isolated backend.** The backend sits behind the `SyncAdapter` interface. Supabase is the reference implementation, not a hard dependency of the engine.

### Stack

- **Core:** TypeScript, **Zod** validation, ULID ids, ISO-8601 UTC timestamps.
- **Local store:** IndexedDB (web) / SQLite via `expo-sqlite` (native), behind one storage interface.
- **Backend (default adapter):** **Supabase** — Postgres + Row-Level Security + Auth + Storage. RLS provides per-user/tenant isolation; audit via triggers; encryption at rest; HIPAA/BAA path on business tiers.
- **Web / landing:** Next.js on Vercel. **Native:** Expo.
- **Testing:** Vitest (unit), React Testing Library + `axe` (web components), RN Testing Library (native), Playwright (web E2E).

---

## 4. Data Model

### Observation (immutable event)

```ts
type Observation = {
  id: ULID
  subjectId: ID              // whose twin this belongs to
  occurredAt: ISO            // when it was felt (defaults to now, editable)
  createdAt: ISO             // when it was recorded

  location: {
    regionId: RegionId       // "knee", "lower_back", "shoulder"…
    side: "left" | "right" | "central"
    view: "anterior" | "posterior"
    point?: { x: number; y: number }  // normalized 0–1 within the region, optional
  }

  type: "pain" | "stiffness" | "numbness" | "tingling"
      | "swelling" | "weakness" | "other"
  quality?: Quality[]        // sharp | dull | burning | throbbing | aching | stabbing | cramping
  intensity?: number         // 0–10
  note?: string              // free text; column-level encrypted at rest
  contextTags?: string[]     // "after-PT", "morning", or user-defined

  taxonomyVersion: string    // anatomy taxonomy version at capture time

  // immutability & audit
  supersedes?: ULID          // an edit writes a NEW record pointing at the old one
  tombstone?: boolean        // a delete is also a new record, never a mutation

  // provenance / sync
  origin: ID                 // device/client that created it
}
```

**Current-state derivation:** the "live" set of observations is computed by folding the log — take the latest record in each `supersedes` chain, drop chains ending in a `tombstone`. This fold is a pure function in `core` and is the basis of both the query API and the review surfaces.

### Anatomy taxonomy (data-driven registry)

```ts
type Region = {
  id: RegionId               // stable slug, e.g. "knee"
  label: string              // "Knee"
  group: "head_neck" | "trunk" | "upper_limb" | "lower_limb"
  bilateral: boolean         // knee=true, sternum=false
  views: ("anterior" | "posterior")[]  // where the region appears
}
```

- The registry ships as versioned data (`taxonomyVersion`). ~50 regions at v1, extensible.
- `bodymap-core` holds SVG path geometry keyed by `(regionId, side, view)`, decoupled from the semantic registry so visuals and semantics can evolve independently.

### Query API (in `core`)

A small, typed query surface over the folded log, e.g.:

- `observations({ range?, regionId?, side?, type?, tags? }): Observation[]`
- `heatmap({ range, metric: "frequency" | "meanIntensity" | "recency" }): Map<RegionKey, number>`
- `timeline({ range?, filters? }): DayGroup[]`

These are the primitives the review components and any downstream (doctor portal, AI processing) consume. `RegionKey` = `(regionId, side, view)`.

---

## 5. Body-Map Component Behavior

One component, two modes, shared across web and native.

- **Capture mode:** tap a region → it highlights → an entry sheet opens (type, quality chips, 0–10 intensity slider, note, context tags, `occurredAt` defaulting to now). An optional second tap drops a precise normalized x/y point inside the region. Save → new `Observation` in the local store + outbox.
- **Review / heatmap mode:** aggregate observations over a chosen time window and shade each region by a toggleable metric — **frequency**, **mean intensity**, or **recency** — with a legend. Tap a region to filter the timeline to it.
- **Timeline:** reverse-chronological, grouped by day, filterable by region / type / date range.

### Accessibility (first-class)

- Every region is a focusable, labeled element; full keyboard navigation.
- Screen readers announce region label + current state.
- The heatmap never relies on color alone — labels/patterns convey the same information.
- Targets meet WCAG AA contrast and touch-target sizing.

---

## 6. Sync Engine & Adapter

The device's local store is the source of truth; unsynced records sit in an outbox. Because observations are immutable and ULID-keyed, sync is idempotent and conflict-free — push new records, pull records since a cursor.

```ts
interface SyncAdapter {
  authenticate(): Promise<Session>
  push(records: Observation[]): Promise<{ acked: ULID[] }>
  pull(cursor?: Cursor): Promise<{ records: Observation[]; cursor: Cursor }>
}
```

- **Default:** `HealthTwinCloudAdapter` → Supabase.
- **Partner BYO-backend:** implement this one interface.
- **Offline behavior:** capture always succeeds locally; sync retries with backoff when connectivity returns; `acked` ULIDs are marked synced; `pull` merges by ULID (idempotent).

---

## 7. Security & Privacy Model

The platform's highest-priority requirement. Concretely:

- **Authentication:** Supabase Auth (email/OTP, passkeys). Partners authenticate *their* users via a short-lived signed-token handoff, exchanged for a scoped session — partner users never touch HealthTwin's login UI.
- **Authorization:** Postgres **Row-Level Security**. Base policy: `subject_id = auth.uid()`. Nobody reads anyone else's rows by default.
- **Consent-based sharing:** a `consent_grants` table — explicit, scoped, **time-boxed, revocable** grants (e.g., "share knee history with Dr. X, read-only, 30 days"). Sharing is a grant, never a data copy.
- **Encryption:** TLS in transit; encrypted at rest (KMS-managed keys); the free-text `note` column gets column-level encryption.
- **Audit:** an append-only log of every read / share / export.
- **Multi-tenant SDK isolation:** `partner_id` scoping walls off each partner's users; a partner accesses raw data only where the user has explicitly consented.
- **GDPR data-subject rights:** export (portability) and erasure (tombstone → scheduled purge job).
- **Acknowledged trade-off:** because the model is encrypted-at-rest (not zero-knowledge), the server *can* decrypt to run processing and serve authorized views. This is mitigated by RLS, least-privilege service roles, full audit, and a BAA. The opt-in E2E path remains open for a future iteration.

---

## 8. Partner SDK / Embed Surface

- **`@healthtwin/react`:** `<HealthTwinProvider config={{ adapter, session, theme }}>`, `<BodyMapCapture/>`, `<BodyMapReview/>`, `<Timeline/>`, and a `useObservations()` hook.
- **`@healthtwin/embed`:** a `<health-twin-capture>` **web component** plus an **iframe** fallback for non-React or stricter-isolation partners — configured via attributes + a `postMessage` API.
- **Theming:** brand-themeable via design tokens (CSS variables).
- **Two integration modes:** **hosted** (data in HealthTwinCloud) or **bring-your-own-backend** (partner implements the adapter).

---

## 9. Scope Boundaries (YAGNI)

Explicitly **out of scope** for the capture engine v1 — each is its own later track:

- Wearable / Apple HealthKit / Google Fit ingestion → data-integration subsystem.
- Manual vitals (blood pressure, heart rate, weight, temperature) & daily mood/energy check-in.
- First-class in-app workout / PT session logging.
- AI insights/processing engine (the engine only emits clean, queryable, processing-ready data).
- The full doctor portal (the engine ships review components + query API + consent primitives it needs).
- Zero-knowledge / E2E encryption mode.
- The landing/marketing page.

---

## 10. Testing Strategy (TDD throughout)

- **`core` / `bodymap-core`:** heavy unit coverage (Vitest) — schema validation, taxonomy integrity, hit-testing, heatmap math, log-folding/supersede resolution, sync idempotency. All headless.
- **Adapter:** contract tests against the `SyncAdapter` interface + integration tests against a local Supabase.
- **Components:** React Testing Library + `axe` accessibility assertions (web); RN Testing Library (native).
- **Security:** RLS policy tests (cross-user reads *must* fail), consent grant/expiry/revoke tests, audit-log assertions.
- **E2E:** Playwright — full capture → sync → review flow on web.

---

## 11. Open Questions / Deferred

- Exact v1 region set (~50) and their SVG geometry — to be finalized during implementation from a licensed/curated anatomical asset.
- Column-level encryption mechanism specifics (pgcrypto vs application-layer) — to be settled in the backend implementation.
- Partner token-handoff protocol details (OIDC vs custom signed token) — to be settled when the first partner (ColorRef) integration begins.
- Native local store library choice (`expo-sqlite` vs alternatives) — validate during native app spin-up.
