# @healthtwin/native

Native (React Native / Expo) building blocks for HealthTwin.

- `createSqliteStore(db)` — a `LocalStore` (from `@healthtwin/core`) over any `SqlDb`.
- `expoSqliteAdapter(database)` — adapts an `expo-sqlite` database to `SqlDb`.

On device:

```ts
import * as SQLite from "expo-sqlite";
import { createSqliteStore, expoSqliteAdapter } from "@healthtwin/native";

const db = await SQLite.openDatabaseAsync("healthtwin.db");
const store = await createSqliteStore(expoSqliteAdapter(db));
```

The store logic is unit-tested against an in-memory `SqlDb`; the expo-sqlite glue
runs on a device/simulator (see `apps/native`).
