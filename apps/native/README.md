# HealthTwin — Expo app

A React Native / Expo app that mirrors the web experience on-device, reusing the
shared HealthTwin packages. Three tabs, one design language:

- **Capture** — the body figure (`BodyMapNative`, same headless geometry from
  `@healthtwin/bodymap-core` via `react-native-svg`) with a modal entry sheet
  (type + quality chips, a 0–10 spectrum intensity picker), and entries as cards
  with an intensity meter.
- **Review** — a heat map (`computeHeatmap` + `shadingFor`) with a metric toggle,
  and a timeline (`buildTimeline`).
- **Insights** — the pure engine on-device: a `summarize` + `templateNarrator`
  narrative, latest vitals, and symptom↔metric correlation (`correlateSymptomWithMetric`)
  drawn with `react-native-svg`. Includes a "seed a demo week" button.

## Architecture

- **Data:** `@healthtwin/native` — `createSqliteStore` (observations) and
  `createSqliteSampleStore` (vitals) over `expo-sqlite`; both store layers are
  unit-tested in `packages/native`.
- **State:** a DOM-free provider (`@healthtwin/core` only) — the web provider logic,
  RN-safe — plus `useNativeVitals` for the sample stream.
- **Engine:** `@healthtwin/insights` + `@healthtwin/vitals` are pure TS and run
  unchanged under React Native.

## Why it's excluded from the workspace

`pnpm-workspace.yaml` excludes `apps/native` (`!apps/native`) so the default
`pnpm install` stays light and CI doesn't pull the React Native toolchain.

## Running it (needs a simulator/device)

1. Remove the `- "!apps/native"` line from `pnpm-workspace.yaml` (so the
   `@healthtwin/*` packages link), then `pnpm install`.
2. `cd apps/native && npx expo install` (fills in native deps for your Expo SDK).
3. `npx expo start` and open on iOS/Android.

> The screens are not exercised by this repo's automated tests (no RN runtime in
> CI). The tested surface is `@healthtwin/native` (store logic), `@healthtwin/vitals`,
> `@healthtwin/insights`, and the shared `@healthtwin/core` — all consumed here as-is.
