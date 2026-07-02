# HealthTwin

An embeddable **human digital twin** for health — an interactive body-map symptom/pain
capture engine that builds a longitudinal record of what a person actually feels over time.
Usable both as its own app and as an **SDK** that partners (clinics, fitness platforms)
embed, so a clinician or the person can see *what happened this week* — where it hurt, how
much, when, in what context.

## Monorepo

| Package | Purpose |
|---|---|
| `@healthtwin/core` | Domain model (immutable observations), anatomy taxonomy, query, heatmap/timeline aggregation, sync engine — **zero UI deps** |
| `@healthtwin/bodymap-core` | Headless SVG region geometry, hit-testing, heat color math |
| `@healthtwin/bodymap-react` | Accessible SVG body map (web) |
| `@healthtwin/react` | Web SDK: provider + hooks, capture + review components, IndexedDB store & sync-meta |
| `@healthtwin/supabase` | Reference cloud `SyncAdapter` + auth + RLS/consent/audit SQL migrations |
| `@healthtwin/native` | React Native / Expo `SqliteStore` (expo-sqlite) |
| `@healthtwin/embed` | Framework-agnostic `<health-twin-capture>` web component + partner token exchange |
| `apps/web` | Next.js app — capture + `/review` (heatmap + timeline) |
| `apps/native` | Expo scaffold (excluded from the default workspace) |

## Quickstart

```bash
pnpm install
pnpm -w test                        # ~49 unit tests across the packages
pnpm --filter @healthtwin/web dev   # tap a body region → log a symptom → persists offline → /review shows a heatmap + timeline
```

## Architecture highlights

- **Immutable event log** (edits/deletes are new records via supersede/tombstone) → conflict-free sync and full clinical history.
- **Local-first** with a pluggable `SyncAdapter` — default is Supabase; a partner can bring their own backend, or keep data entirely in their system via the embed's capture events.
- **Security:** encrypted-at-rest + Postgres Row-Level Security, consent-based (scoped, time-boxed, revocable) sharing, and an audit log.
- One shared body-map geometry renders on **web (SVG)** and **native (react-native-svg)**.

## Design & research

See [`docs/superpowers/`](docs/superpowers/) for the design spec and phased implementation
plans, and [`docs/research/`](docs/research/) for the competitive + regulatory landscape brief.

## Status

Phases 1–5 are implemented and tested. Two seams need your credentials/hardware to run live:

- **Supabase** — apply [`packages/supabase/schema.sql`](packages/supabase/schema.sql), then set `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- **Native app** — needs Expo + an iOS/Android simulator (see [`apps/native/README.md`](apps/native/README.md)).

> The body-map regions are placeholder rectangles — swap in licensed anatomical SVG art before shipping to users.
