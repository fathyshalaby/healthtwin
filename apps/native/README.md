# HealthTwin — Expo app (scaffold)

A React Native / Expo capture app reusing the shared HealthTwin core:

- **Data:** `@healthtwin/native` `createSqliteStore` over `expo-sqlite` (the store logic is unit-tested in `packages/native`).
- **Body map:** `BodyMapNative` renders the same headless geometry from `@healthtwin/bodymap-core` via `react-native-svg`.
- **State:** a DOM-free provider (`@healthtwin/core` only) — the web `HealthTwinProvider` logic, RN-safe.

## Why it's excluded from the workspace

`pnpm-workspace.yaml` excludes `apps/native` (`!apps/native`) so the default
`pnpm install` stays light and CI doesn't pull the React Native toolchain.

## Running it (needs a simulator/device)

1. Remove the `- "!apps/native"` line from `pnpm-workspace.yaml` (so the `@healthtwin/*` packages link), then `pnpm install`.
2. `cd apps/native && npx expo install` (fills in native deps for your Expo SDK).
3. `npx expo start` and open on iOS/Android.

> Not exercised in this repo's automated tests — the tested surface is
> `@healthtwin/native` (store logic) and the shared `@healthtwin/core`.
