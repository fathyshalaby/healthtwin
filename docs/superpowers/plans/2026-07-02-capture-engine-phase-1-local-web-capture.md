# Capture Engine — Phase 1: Local-First Web Capture — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a local-first web experience where a user taps a 2D body map, logs a rich symptom observation, and it persists offline in the browser and appears in a list.

**Architecture:** A pnpm+Turborepo monorepo. A pure-TS `core` owns the domain (immutable `Observation`, versioned anatomy taxonomy, validation, query, storage interface). `bodymap-core` holds headless SVG geometry + hit-testing. `bodymap-react` renders the body map as SVG. `react` composes capture UI + an IndexedDB store. `apps/web` (Next.js) wires it into a page. No backend, no sync, no native in this phase.

**Tech Stack:** TypeScript (strict), pnpm workspaces, Turborepo, Zod, `ulid`, `idb` (IndexedDB), React 19, Next.js (App Router), Vitest + jsdom + @testing-library/react + vitest-axe + fake-indexeddb, Playwright.

## Global Constraints

- **Language:** TypeScript, `strict: true`, everywhere. No `any` in exported signatures.
- **Runtime:** Node.js 24 LTS. Package manager: **pnpm** (workspaces). Build orchestration: **Turborepo**.
- **IDs:** ULID via the `ulid` package (`newId()`). **Timestamps:** ISO-8601 UTC strings (`new Date().toISOString()`).
- **Immutability:** an `Observation` is NEVER mutated. Edits write a new record with `supersedes`; deletes write a record with `tombstone: true`.
- **Validation:** all observations pass a Zod schema before persistence. `intensity` ∈ [0,10]. `regionId` must exist in the taxonomy.
- **Taxonomy:** every observation records `taxonomyVersion` (constant `TAXONOMY_VERSION`).
- **Local-first:** capture must succeed with no network. Persistence is IndexedDB in the browser.
- **Accessibility:** every body region is keyboard-focusable and screen-reader labeled; components pass `vitest-axe` with no violations. WCAG AA.
- **Testing:** strict TDD — failing test first, minimal impl, green, commit. Frequent commits.
- **RegionKey format:** `` `${regionId}:${side}:${view}` `` (produced by `regionKey()`); this exact string is used everywhere a region is keyed.

---

### Task 1: Monorepo & tooling scaffold

**Files:**
- Create: `package.json`, `pnpm-workspace.yaml`, `turbo.json`, `tsconfig.base.json`, `vitest.config.ts`
- Create: `packages/core/package.json`, `packages/core/tsconfig.json`, `packages/core/src/index.ts`
- Test: `packages/core/src/smoke.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: a working `pnpm -w test` command; `@healthtwin/core` package resolvable by other packages.

- [ ] **Step 1: Write the failing smoke test**

`packages/core/src/smoke.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { hello } from "./index";

describe("scaffold", () => {
  it("exports a hello marker", () => {
    expect(hello()).toBe("healthtwin");
  });
});
```

- [ ] **Step 2: Create workspace config**

`pnpm-workspace.yaml`:
```yaml
packages:
  - "packages/*"
  - "apps/*"
```

Root `package.json`:
```json
{
  "name": "healthtwin",
  "private": true,
  "packageManager": "pnpm@9.12.0",
  "scripts": {
    "test": "turbo run test",
    "build": "turbo run build",
    "typecheck": "turbo run typecheck"
  },
  "devDependencies": {
    "turbo": "^2.1.0",
    "typescript": "^5.6.0",
    "vitest": "^2.1.0"
  }
}
```

`turbo.json`:
```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "test": { "dependsOn": ["^build"] },
    "build": { "dependsOn": ["^build"], "outputs": ["dist/**"] },
    "typecheck": { "dependsOn": ["^build"] }
  }
}
```

`tsconfig.base.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "declaration": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "jsx": "react-jsx"
  }
}
```

`vitest.config.ts` (root, shared defaults):
```ts
import { defineConfig } from "vitest/config";
export default defineConfig({
  test: { environment: "node", passWithNoTests: false },
});
```

- [ ] **Step 3: Create the core package**

`packages/core/package.json`:
```json
{
  "name": "@healthtwin/core",
  "version": "0.0.0",
  "type": "module",
  "main": "src/index.ts",
  "types": "src/index.ts",
  "scripts": {
    "test": "vitest run",
    "typecheck": "tsc --noEmit",
    "build": "tsc -p tsconfig.json"
  },
  "dependencies": { "ulid": "^2.3.0", "zod": "^3.23.0" },
  "devDependencies": { "vitest": "^2.1.0", "typescript": "^5.6.0" }
}
```

`packages/core/tsconfig.json`:
```json
{ "extends": "../../tsconfig.base.json", "compilerOptions": { "outDir": "dist" }, "include": ["src"] }
```

`packages/core/src/index.ts`:
```ts
export const hello = (): string => "healthtwin";
```

- [ ] **Step 4: Install and run the test**

Run: `pnpm install && pnpm -w test`
Expected: PASS (core smoke test green).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: scaffold pnpm+turbo monorepo with core package"
```

---

### Task 2: Core domain types & id helpers

**Files:**
- Create: `packages/core/src/types.ts`, `packages/core/src/ids.ts`
- Modify: `packages/core/src/index.ts`
- Test: `packages/core/src/ids.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - Types: `ULID`, `ISO`, `ID`, `Side`, `BodyView`, `ObservationType`, `Quality`, `Location`, `Observation`, `Region`, `RegionKey`.
  - `newId(): ULID`, `nowISO(): ISO`.

- [ ] **Step 1: Write the failing test**

`packages/core/src/ids.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { newId, nowISO } from "./ids";

describe("ids", () => {
  it("newId returns a 26-char ULID", () => {
    expect(newId()).toMatch(/^[0-9A-HJKMNP-TV-Z]{26}$/);
  });
  it("nowISO returns an ISO-8601 UTC string", () => {
    expect(nowISO()).toMatch(/^\d{4}-\d{2}-\d{2}T.*Z$/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @healthtwin/core test`
Expected: FAIL — cannot find `./ids`.

- [ ] **Step 3: Write the types**

`packages/core/src/types.ts`:
```ts
export type ULID = string;
export type ISO = string;
export type ID = string;

export type Side = "left" | "right" | "central";
export type BodyView = "anterior" | "posterior";
export type ObservationType =
  | "pain" | "stiffness" | "numbness" | "tingling"
  | "swelling" | "weakness" | "other";
export type Quality =
  | "sharp" | "dull" | "burning" | "throbbing"
  | "aching" | "stabbing" | "cramping";

export interface Location {
  regionId: string;
  side: Side;
  view: BodyView;
  point?: { x: number; y: number };
}

export interface Observation {
  id: ULID;
  subjectId: ID;
  occurredAt: ISO;
  createdAt: ISO;
  location: Location;
  type: ObservationType;
  quality?: Quality[];
  intensity?: number;
  note?: string;
  contextTags?: string[];
  taxonomyVersion: string;
  supersedes?: ULID;
  tombstone?: boolean;
  origin: ID;
}

export interface Region {
  id: string;
  label: string;
  group: "head_neck" | "trunk" | "upper_limb" | "lower_limb";
  bilateral: boolean;
  views: BodyView[];
}

export type RegionKey = string; // `${regionId}:${side}:${view}`
```

- [ ] **Step 4: Write the id helpers**

`packages/core/src/ids.ts`:
```ts
import { ulid } from "ulid";
import type { ULID, ISO } from "./types";

export const newId = (): ULID => ulid();
export const nowISO = (): ISO => new Date().toISOString();
```

- [ ] **Step 5: Re-export from index**

`packages/core/src/index.ts` (replace contents):
```ts
export * from "./types";
export * from "./ids";
```

- [ ] **Step 6: Run tests**

Run: `pnpm --filter @healthtwin/core test`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "feat(core): domain types and id/time helpers"
```

---

### Task 3: Anatomy taxonomy registry

**Files:**
- Create: `packages/core/src/taxonomy.ts`
- Modify: `packages/core/src/index.ts`
- Test: `packages/core/src/taxonomy.test.ts`

**Interfaces:**
- Consumes: `Region`, `Side`, `BodyView`, `RegionKey`, `Location` from Task 2.
- Produces:
  - `TAXONOMY_VERSION: string`
  - `REGIONS: Region[]`
  - `getRegion(id: string): Region | undefined`
  - `regionKey(loc: { regionId: string; side: Side; view: BodyView }): RegionKey`

- [ ] **Step 1: Write the failing test**

`packages/core/src/taxonomy.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { REGIONS, getRegion, regionKey, TAXONOMY_VERSION } from "./taxonomy";

describe("taxonomy", () => {
  it("has a version and a non-empty region set", () => {
    expect(TAXONOMY_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
    expect(REGIONS.length).toBeGreaterThan(0);
  });
  it("every region id is unique", () => {
    const ids = REGIONS.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
  it("getRegion finds by id and returns undefined otherwise", () => {
    expect(getRegion("knee")?.label).toBe("Knee");
    expect(getRegion("nope")).toBeUndefined();
  });
  it("regionKey formats regionId:side:view", () => {
    expect(regionKey({ regionId: "knee", side: "left", view: "anterior" }))
      .toBe("knee:left:anterior");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @healthtwin/core test`
Expected: FAIL — cannot find `./taxonomy`.

- [ ] **Step 3: Write the taxonomy**

`packages/core/src/taxonomy.ts`:
```ts
import type { Region, RegionKey, Side, BodyView } from "./types";

export const TAXONOMY_VERSION = "1.0.0";

// Starter set. Extensible: add rows here, bump TAXONOMY_VERSION on changes.
export const REGIONS: Region[] = [
  { id: "head", label: "Head", group: "head_neck", bilateral: false, views: ["anterior", "posterior"] },
  { id: "neck", label: "Neck", group: "head_neck", bilateral: false, views: ["anterior", "posterior"] },
  { id: "chest", label: "Chest", group: "trunk", bilateral: false, views: ["anterior"] },
  { id: "abdomen", label: "Abdomen", group: "trunk", bilateral: false, views: ["anterior"] },
  { id: "lower_back", label: "Lower Back", group: "trunk", bilateral: false, views: ["posterior"] },
  { id: "shoulder", label: "Shoulder", group: "upper_limb", bilateral: true, views: ["anterior", "posterior"] },
  { id: "knee", label: "Knee", group: "lower_limb", bilateral: true, views: ["anterior"] },
];

export const getRegion = (id: string): Region | undefined =>
  REGIONS.find((r) => r.id === id);

export const regionKey = (loc: { regionId: string; side: Side; view: BodyView }): RegionKey =>
  `${loc.regionId}:${loc.side}:${loc.view}`;
```

- [ ] **Step 4: Re-export**

Append to `packages/core/src/index.ts`:
```ts
export * from "./taxonomy";
```

- [ ] **Step 5: Run tests**

Run: `pnpm --filter @healthtwin/core test`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat(core): versioned anatomy taxonomy registry"
```

---

### Task 4: Observation schema & factory

**Files:**
- Create: `packages/core/src/schema.ts`
- Modify: `packages/core/src/index.ts`
- Test: `packages/core/src/schema.test.ts`

**Interfaces:**
- Consumes: `Observation`, `Location`, `ObservationType`, `Quality`, `ID`, `ISO` (Task 2); `TAXONOMY_VERSION`, `getRegion` (Task 3); `newId`, `nowISO` (Task 2).
- Produces:
  - `ObservationSchema` (Zod) validating an `Observation`.
  - `NewObservation` type (user-supplied fields).
  - `ObservationContext = { subjectId: ID; origin: ID }`.
  - `createObservation(input: NewObservation, ctx: ObservationContext): Observation` — fills id/createdAt/occurredAt/taxonomyVersion, validates, throws on invalid.

- [ ] **Step 1: Write the failing test**

`packages/core/src/schema.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { createObservation } from "./schema";

const ctx = { subjectId: "subj_1", origin: "device_1" };

describe("createObservation", () => {
  it("builds a valid observation with generated fields", () => {
    const o = createObservation(
      { location: { regionId: "knee", side: "left", view: "anterior" }, type: "pain", intensity: 6 },
      ctx,
    );
    expect(o.id).toMatch(/^[0-9A-HJKMNP-TV-Z]{26}$/);
    expect(o.subjectId).toBe("subj_1");
    expect(o.taxonomyVersion).toBe("1.0.0");
    expect(o.occurredAt).toBe(o.createdAt); // default
    expect(o.intensity).toBe(6);
  });
  it("rejects intensity out of range", () => {
    expect(() =>
      createObservation(
        { location: { regionId: "knee", side: "left", view: "anterior" }, type: "pain", intensity: 99 },
        ctx,
      ),
    ).toThrow();
  });
  it("rejects an unknown region", () => {
    expect(() =>
      createObservation(
        { location: { regionId: "wing", side: "left", view: "anterior" }, type: "pain" },
        ctx,
      ),
    ).toThrow(/region/i);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @healthtwin/core test`
Expected: FAIL — cannot find `./schema`.

- [ ] **Step 3: Write the schema & factory**

`packages/core/src/schema.ts`:
```ts
import { z } from "zod";
import type { Observation, ID } from "./types";
import { newId, nowISO } from "./ids";
import { TAXONOMY_VERSION, getRegion } from "./taxonomy";

const LocationSchema = z.object({
  regionId: z.string().min(1),
  side: z.enum(["left", "right", "central"]),
  view: z.enum(["anterior", "posterior"]),
  point: z.object({ x: z.number().min(0).max(1), y: z.number().min(0).max(1) }).optional(),
});

export const ObservationSchema = z.object({
  id: z.string().length(26),
  subjectId: z.string().min(1),
  occurredAt: z.string().min(1),
  createdAt: z.string().min(1),
  location: LocationSchema,
  type: z.enum(["pain", "stiffness", "numbness", "tingling", "swelling", "weakness", "other"]),
  quality: z.array(z.enum(["sharp", "dull", "burning", "throbbing", "aching", "stabbing", "cramping"])).optional(),
  intensity: z.number().min(0).max(10).optional(),
  note: z.string().max(2000).optional(),
  contextTags: z.array(z.string().min(1)).optional(),
  taxonomyVersion: z.string().min(1),
  supersedes: z.string().length(26).optional(),
  tombstone: z.boolean().optional(),
  origin: z.string().min(1),
});

export interface NewObservation {
  location: Observation["location"];
  type: Observation["type"];
  quality?: Observation["quality"];
  intensity?: number;
  note?: string;
  contextTags?: string[];
  occurredAt?: string;
}

export interface ObservationContext {
  subjectId: ID;
  origin: ID;
}

export function createObservation(input: NewObservation, ctx: ObservationContext): Observation {
  if (!getRegion(input.location.regionId)) {
    throw new Error(`Unknown region: ${input.location.regionId}`);
  }
  const createdAt = nowISO();
  const candidate: Observation = {
    id: newId(),
    subjectId: ctx.subjectId,
    origin: ctx.origin,
    createdAt,
    occurredAt: input.occurredAt ?? createdAt,
    location: input.location,
    type: input.type,
    quality: input.quality,
    intensity: input.intensity,
    note: input.note,
    contextTags: input.contextTags,
    taxonomyVersion: TAXONOMY_VERSION,
  };
  return ObservationSchema.parse(candidate) as Observation;
}
```

- [ ] **Step 4: Re-export**

Append to `packages/core/src/index.ts`:
```ts
export * from "./schema";
```

- [ ] **Step 5: Run tests**

Run: `pnpm --filter @healthtwin/core test`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat(core): observation Zod schema and validated factory"
```

---

### Task 5: Immutable log folding

**Files:**
- Create: `packages/core/src/log.ts`
- Modify: `packages/core/src/index.ts`
- Test: `packages/core/src/log.test.ts`

**Interfaces:**
- Consumes: `Observation` (Task 2).
- Produces: `foldLog(all: Observation[]): Observation[]` — returns the current live set (latest of each supersede chain, tombstones removed). Assumes linear chains (each record superseded at most once).

- [ ] **Step 1: Write the failing test**

`packages/core/src/log.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { foldLog } from "./log";
import type { Observation } from "./types";

const base = (over: Partial<Observation>): Observation => ({
  id: "0".repeat(26),
  subjectId: "s",
  occurredAt: "2026-07-02T10:00:00.000Z",
  createdAt: "2026-07-02T10:00:00.000Z",
  location: { regionId: "knee", side: "left", view: "anterior" },
  type: "pain",
  taxonomyVersion: "1.0.0",
  origin: "d",
  ...over,
});

describe("foldLog", () => {
  it("keeps a lone record", () => {
    const a = base({ id: "A".repeat(26) });
    expect(foldLog([a]).map((o) => o.id)).toEqual(["A".repeat(26)]);
  });
  it("keeps the superseding record, drops the old", () => {
    const a = base({ id: "A".repeat(26) });
    const b = base({ id: "B".repeat(26), supersedes: "A".repeat(26), intensity: 9 });
    const live = foldLog([a, b]);
    expect(live.map((o) => o.id)).toEqual(["B".repeat(26)]);
  });
  it("removes tombstoned chains entirely", () => {
    const a = base({ id: "A".repeat(26) });
    const t = base({ id: "T".repeat(26), supersedes: "A".repeat(26), tombstone: true });
    expect(foldLog([a, t])).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @healthtwin/core test`
Expected: FAIL — cannot find `./log`.

- [ ] **Step 3: Write the fold**

`packages/core/src/log.ts`:
```ts
import type { Observation, ULID } from "./types";

export function foldLog(all: Observation[]): Observation[] {
  const superseded = new Set<ULID>();
  for (const o of all) if (o.supersedes) superseded.add(o.supersedes);
  return all.filter((o) => !superseded.has(o.id) && !o.tombstone);
}
```

- [ ] **Step 4: Re-export**

Append to `packages/core/src/index.ts`:
```ts
export * from "./log";
```

- [ ] **Step 5: Run tests**

Run: `pnpm --filter @healthtwin/core test`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat(core): immutable log folding (supersede + tombstone)"
```

---

### Task 6: Query — observations filter

**Files:**
- Create: `packages/core/src/query.ts`
- Modify: `packages/core/src/index.ts`
- Test: `packages/core/src/query.test.ts`

**Interfaces:**
- Consumes: `Observation`, `Side`, `ObservationType`, `ISO` (Task 2).
- Produces:
  - `ObservationFilter = { regionId?: string; side?: Side; type?: ObservationType; from?: ISO; to?: ISO }`
  - `queryObservations(current: Observation[], f?: ObservationFilter): Observation[]` — filters, sorted by `occurredAt` descending.

- [ ] **Step 1: Write the failing test**

`packages/core/src/query.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { queryObservations } from "./query";
import type { Observation } from "./types";

const mk = (id: string, over: Partial<Observation>): Observation => ({
  id, subjectId: "s", occurredAt: "2026-07-02T10:00:00.000Z", createdAt: "2026-07-02T10:00:00.000Z",
  location: { regionId: "knee", side: "left", view: "anterior" }, type: "pain",
  taxonomyVersion: "1.0.0", origin: "d", ...over,
});

describe("queryObservations", () => {
  const rows = [
    mk("a", { occurredAt: "2026-07-01T10:00:00.000Z", location: { regionId: "knee", side: "left", view: "anterior" } }),
    mk("b", { occurredAt: "2026-07-03T10:00:00.000Z", location: { regionId: "chest", side: "central", view: "anterior" }, type: "stiffness" }),
  ];
  it("returns all sorted by occurredAt desc when no filter", () => {
    expect(queryObservations(rows).map((o) => o.id)).toEqual(["b", "a"]);
  });
  it("filters by regionId", () => {
    expect(queryObservations(rows, { regionId: "chest" }).map((o) => o.id)).toEqual(["b"]);
  });
  it("filters by date range (inclusive)", () => {
    expect(queryObservations(rows, { from: "2026-07-02T00:00:00.000Z" }).map((o) => o.id)).toEqual(["b"]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @healthtwin/core test`
Expected: FAIL — cannot find `./query`.

- [ ] **Step 3: Write the query**

`packages/core/src/query.ts`:
```ts
import type { Observation, Side, ObservationType, ISO } from "./types";

export interface ObservationFilter {
  regionId?: string;
  side?: Side;
  type?: ObservationType;
  from?: ISO;
  to?: ISO;
}

export function queryObservations(current: Observation[], f: ObservationFilter = {}): Observation[] {
  return current
    .filter((o) => !f.regionId || o.location.regionId === f.regionId)
    .filter((o) => !f.side || o.location.side === f.side)
    .filter((o) => !f.type || o.type === f.type)
    .filter((o) => !f.from || o.occurredAt >= f.from)
    .filter((o) => !f.to || o.occurredAt <= f.to)
    .slice()
    .sort((a, b) => (a.occurredAt < b.occurredAt ? 1 : a.occurredAt > b.occurredAt ? -1 : 0));
}
```

- [ ] **Step 4: Re-export**

Append to `packages/core/src/index.ts`:
```ts
export * from "./query";
```

- [ ] **Step 5: Run tests**

Run: `pnpm --filter @healthtwin/core test`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat(core): observation query/filter with desc sort"
```

---

### Task 7: LocalStore interface & in-memory implementation

**Files:**
- Create: `packages/core/src/store.ts`
- Modify: `packages/core/src/index.ts`
- Test: `packages/core/src/store.test.ts`

**Interfaces:**
- Consumes: `Observation` (Task 2).
- Produces:
  - `interface LocalStore { all(): Promise<Observation[]>; append(record: Observation): Promise<void>; }`
  - `createMemoryStore(): LocalStore` (used by tests and later phases).

- [ ] **Step 1: Write the failing test**

`packages/core/src/store.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { createMemoryStore } from "./store";
import type { Observation } from "./types";

const rec: Observation = {
  id: "A".repeat(26), subjectId: "s", occurredAt: "2026-07-02T10:00:00.000Z",
  createdAt: "2026-07-02T10:00:00.000Z", location: { regionId: "knee", side: "left", view: "anterior" },
  type: "pain", taxonomyVersion: "1.0.0", origin: "d",
};

describe("memory store", () => {
  it("appends and returns records", async () => {
    const s = createMemoryStore();
    expect(await s.all()).toEqual([]);
    await s.append(rec);
    expect(await s.all()).toEqual([rec]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @healthtwin/core test`
Expected: FAIL — cannot find `./store`.

- [ ] **Step 3: Write the store**

`packages/core/src/store.ts`:
```ts
import type { Observation } from "./types";

export interface LocalStore {
  all(): Promise<Observation[]>;
  append(record: Observation): Promise<void>;
}

export function createMemoryStore(): LocalStore {
  const rows: Observation[] = [];
  return {
    async all() { return [...rows]; },
    async append(record) { rows.push(record); },
  };
}
```

- [ ] **Step 4: Re-export**

Append to `packages/core/src/index.ts`:
```ts
export * from "./store";
```

- [ ] **Step 5: Run tests**

Run: `pnpm --filter @healthtwin/core test`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat(core): LocalStore interface and in-memory store"
```

---

### Task 8: bodymap-core geometry & hit-testing

**Files:**
- Create: `packages/bodymap-core/package.json`, `packages/bodymap-core/tsconfig.json`, `packages/bodymap-core/src/index.ts`, `packages/bodymap-core/src/geometry.ts`
- Test: `packages/bodymap-core/src/geometry.test.ts`

**Interfaces:**
- Consumes: `RegionKey`, `Side`, `BodyView`, `regionKey` from `@healthtwin/core`.
- Produces:
  - `interface BBox { x: number; y: number; w: number; h: number }`
  - `interface RegionShape { key: RegionKey; regionId: string; side: Side; view: BodyView; label: string; d: string; bbox: BBox }`
  - `VIEWBOX = { w: 200, h: 400 }`
  - `shapesFor(view: BodyView): RegionShape[]`
  - `normalizedPoint(bbox: BBox, px: number, py: number): { x: number; y: number }` (clamped to [0,1]).

- [ ] **Step 1: Create package files**

`packages/bodymap-core/package.json`:
```json
{
  "name": "@healthtwin/bodymap-core",
  "version": "0.0.0",
  "type": "module",
  "main": "src/index.ts",
  "types": "src/index.ts",
  "scripts": { "test": "vitest run", "typecheck": "tsc --noEmit", "build": "tsc -p tsconfig.json" },
  "dependencies": { "@healthtwin/core": "workspace:*" },
  "devDependencies": { "vitest": "^2.1.0", "typescript": "^5.6.0" }
}
```

`packages/bodymap-core/tsconfig.json`:
```json
{ "extends": "../../tsconfig.base.json", "compilerOptions": { "outDir": "dist" }, "include": ["src"] }
```

- [ ] **Step 2: Write the failing test**

`packages/bodymap-core/src/geometry.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { shapesFor, normalizedPoint } from "./geometry";

describe("geometry", () => {
  it("anterior view includes a knee shape with a valid key", () => {
    const keys = shapesFor("anterior").map((s) => s.key);
    expect(keys).toContain("knee:left:anterior");
  });
  it("normalizedPoint maps into [0,1] and clamps", () => {
    const bbox = { x: 100, y: 200, w: 50, h: 50 };
    expect(normalizedPoint(bbox, 125, 225)).toEqual({ x: 0.5, y: 0.5 });
    expect(normalizedPoint(bbox, 0, 0)).toEqual({ x: 0, y: 0 });
    expect(normalizedPoint(bbox, 9999, 9999)).toEqual({ x: 1, y: 1 });
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `pnpm --filter @healthtwin/bodymap-core test`
Expected: FAIL — cannot find `./geometry`.

- [ ] **Step 4: Write the geometry**

`packages/bodymap-core/src/geometry.ts`:
```ts
import type { RegionKey, Side, BodyView } from "@healthtwin/core";
import { regionKey } from "@healthtwin/core";

export interface BBox { x: number; y: number; w: number; h: number; }

export interface RegionShape {
  key: RegionKey;
  regionId: string;
  side: Side;
  view: BodyView;
  label: string;
  d: string;   // SVG path (placeholder rects; replace with licensed anatomy art later)
  bbox: BBox;
}

export const VIEWBOX = { w: 200, h: 400 };

const rect = (b: BBox): string =>
  `M${b.x} ${b.y} h${b.w} v${b.h} h${-b.w} Z`;

const shape = (
  regionId: string, side: Side, view: BodyView, label: string, bbox: BBox,
): RegionShape => ({ key: regionKey({ regionId, side, view }), regionId, side, view, label, d: rect(bbox), bbox });

// Starter placeholder layout on a 200x400 canvas.
const ANTERIOR: RegionShape[] = [
  shape("head", "central", "anterior", "Head", { x: 85, y: 10, w: 30, h: 40 }),
  shape("neck", "central", "anterior", "Neck", { x: 92, y: 50, w: 16, h: 15 }),
  shape("chest", "central", "anterior", "Chest", { x: 70, y: 70, w: 60, h: 45 }),
  shape("abdomen", "central", "anterior", "Abdomen", { x: 75, y: 120, w: 50, h: 45 }),
  shape("shoulder", "left", "anterior", "Left Shoulder", { x: 55, y: 68, w: 18, h: 18 }),
  shape("shoulder", "right", "anterior", "Right Shoulder", { x: 127, y: 68, w: 18, h: 18 }),
  shape("knee", "left", "anterior", "Left Knee", { x: 78, y: 280, w: 18, h: 22 }),
  shape("knee", "right", "anterior", "Right Knee", { x: 104, y: 280, w: 18, h: 22 }),
];

const POSTERIOR: RegionShape[] = [
  shape("head", "central", "posterior", "Head", { x: 85, y: 10, w: 30, h: 40 }),
  shape("neck", "central", "posterior", "Neck", { x: 92, y: 50, w: 16, h: 15 }),
  shape("lower_back", "central", "posterior", "Lower Back", { x: 78, y: 130, w: 44, h: 40 }),
  shape("shoulder", "left", "posterior", "Left Shoulder", { x: 55, y: 68, w: 18, h: 18 }),
  shape("shoulder", "right", "posterior", "Right Shoulder", { x: 127, y: 68, w: 18, h: 18 }),
];

export function shapesFor(view: BodyView): RegionShape[] {
  return view === "anterior" ? ANTERIOR : POSTERIOR;
}

export function normalizedPoint(bbox: BBox, px: number, py: number): { x: number; y: number } {
  const clamp = (n: number) => Math.min(1, Math.max(0, n));
  return { x: clamp((px - bbox.x) / bbox.w), y: clamp((py - bbox.y) / bbox.h) };
}
```

- [ ] **Step 5: Write the index**

`packages/bodymap-core/src/index.ts`:
```ts
export * from "./geometry";
```

- [ ] **Step 6: Run tests**

Run: `pnpm install && pnpm --filter @healthtwin/bodymap-core test`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "feat(bodymap-core): headless region geometry + normalizedPoint"
```

---

### Task 9: bodymap-react — BodyMap component (capture)

**Files:**
- Create: `packages/bodymap-react/package.json`, `packages/bodymap-react/tsconfig.json`, `packages/bodymap-react/vitest.config.ts`, `packages/bodymap-react/src/index.ts`, `packages/bodymap-react/src/BodyMap.tsx`
- Test: `packages/bodymap-react/src/BodyMap.test.tsx`

**Interfaces:**
- Consumes: `RegionKey`, `Side`, `BodyView` (`@healthtwin/core`); `shapesFor`, `normalizedPoint`, `VIEWBOX`, `RegionShape` (`@healthtwin/bodymap-core`).
- Produces:
  - `interface BodyMapProps { view: BodyView; selectedKey?: RegionKey; onSelect: (sel: { key: RegionKey; regionId: string; side: Side; view: BodyView; point: { x: number; y: number } }) => void; }`
  - `BodyMap: React.FC<BodyMapProps>` — renders an accessible SVG; each region is a focusable, labeled `<path>` firing `onSelect` on click/Enter/Space.

- [ ] **Step 1: Create package files**

`packages/bodymap-react/package.json`:
```json
{
  "name": "@healthtwin/bodymap-react",
  "version": "0.0.0",
  "type": "module",
  "main": "src/index.ts",
  "types": "src/index.ts",
  "scripts": { "test": "vitest run", "typecheck": "tsc --noEmit", "build": "tsc -p tsconfig.json" },
  "dependencies": {
    "@healthtwin/core": "workspace:*",
    "@healthtwin/bodymap-core": "workspace:*"
  },
  "peerDependencies": { "react": "^19.0.0" },
  "devDependencies": {
    "react": "^19.0.0", "react-dom": "^19.0.0",
    "@types/react": "^19.0.0",
    "@testing-library/react": "^16.0.0", "@testing-library/user-event": "^14.5.0",
    "jsdom": "^25.0.0", "vitest": "^2.1.0", "vitest-axe": "^0.1.0", "typescript": "^5.6.0"
  }
}
```

`packages/bodymap-react/tsconfig.json`:
```json
{ "extends": "../../tsconfig.base.json", "compilerOptions": { "outDir": "dist", "jsx": "react-jsx" }, "include": ["src"] }
```

`packages/bodymap-react/vitest.config.ts`:
```ts
import { defineConfig } from "vitest/config";
export default defineConfig({ test: { environment: "jsdom", globals: true } });
```

- [ ] **Step 2: Write the failing test**

`packages/bodymap-react/src/BodyMap.test.tsx`:
```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { BodyMap } from "./BodyMap";

describe("BodyMap", () => {
  it("renders a labeled region and fires onSelect on click", async () => {
    const onSelect = vi.fn();
    render(<BodyMap view="anterior" onSelect={onSelect} />);
    const knee = screen.getByLabelText("Left Knee");
    await userEvent.click(knee);
    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ key: "knee:left:anterior", regionId: "knee", side: "left" }),
    );
  });

  it("fires onSelect on Enter key", async () => {
    const onSelect = vi.fn();
    render(<BodyMap view="anterior" onSelect={onSelect} />);
    const chest = screen.getByLabelText("Chest");
    chest.focus();
    await userEvent.keyboard("{Enter}");
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ key: "chest:central:anterior" }));
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<BodyMap view="anterior" onSelect={() => {}} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `pnpm --filter @healthtwin/bodymap-react test`
Expected: FAIL — cannot find `./BodyMap`.

- [ ] **Step 4: Write the component**

`packages/bodymap-react/src/BodyMap.tsx`:
```tsx
import * as React from "react";
import type { RegionKey, Side, BodyView } from "@healthtwin/core";
import { shapesFor, normalizedPoint, VIEWBOX, type RegionShape } from "@healthtwin/bodymap-core";

export interface BodyMapSelection {
  key: RegionKey;
  regionId: string;
  side: Side;
  view: BodyView;
  point: { x: number; y: number };
}

export interface BodyMapProps {
  view: BodyView;
  selectedKey?: RegionKey;
  onSelect: (sel: BodyMapSelection) => void;
}

export const BodyMap: React.FC<BodyMapProps> = ({ view, selectedKey, onSelect }) => {
  const shapes = shapesFor(view);

  const select = (s: RegionShape, clientX?: number, clientY?: number) => {
    // Default to region center; refine with client coords when available.
    const point =
      clientX != null && clientY != null
        ? normalizedPoint(s.bbox, clientX, clientY)
        : { x: 0.5, y: 0.5 };
    onSelect({ key: s.key, regionId: s.regionId, side: s.side, view: s.view, point });
  };

  return (
    <svg
      viewBox={`0 0 ${VIEWBOX.w} ${VIEWBOX.h}`}
      role="group"
      aria-label={`Body map, ${view} view`}
      width="100%"
    >
      {shapes.map((s) => (
        <path
          key={s.key}
          d={s.d}
          role="button"
          tabIndex={0}
          aria-label={s.label}
          aria-pressed={selectedKey === s.key}
          fill={selectedKey === s.key ? "#2563eb" : "#cbd5e1"}
          stroke="#334155"
          strokeWidth={1}
          style={{ cursor: "pointer" }}
          onClick={(e) => select(s, e.nativeEvent.offsetX, e.nativeEvent.offsetY)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              select(s);
            }
          }}
        />
      ))}
    </svg>
  );
};
```

- [ ] **Step 5: Write the index**

`packages/bodymap-react/src/index.ts`:
```ts
export * from "./BodyMap";
```

- [ ] **Step 6: Run tests**

Run: `pnpm install && pnpm --filter @healthtwin/bodymap-react test`
Expected: PASS (3 tests green, no a11y violations).

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "feat(bodymap-react): accessible SVG BodyMap capture component"
```

---

### Task 10: react — IndexedDB LocalStore

**Files:**
- Create: `packages/react/package.json`, `packages/react/tsconfig.json`, `packages/react/vitest.config.ts`, `packages/react/vitest.setup.ts`, `packages/react/src/index.ts`, `packages/react/src/idbStore.ts`
- Test: `packages/react/src/idbStore.test.ts`

**Interfaces:**
- Consumes: `Observation`, `LocalStore` (`@healthtwin/core`).
- Produces: `createIdbStore(dbName?: string): LocalStore` — an IndexedDB-backed `LocalStore` (append-only object store keyed by `id`).

- [ ] **Step 1: Create package files**

`packages/react/package.json`:
```json
{
  "name": "@healthtwin/react",
  "version": "0.0.0",
  "type": "module",
  "main": "src/index.ts",
  "types": "src/index.ts",
  "scripts": { "test": "vitest run", "typecheck": "tsc --noEmit", "build": "tsc -p tsconfig.json" },
  "dependencies": {
    "@healthtwin/core": "workspace:*",
    "@healthtwin/bodymap-core": "workspace:*",
    "@healthtwin/bodymap-react": "workspace:*",
    "idb": "^8.0.0"
  },
  "peerDependencies": { "react": "^19.0.0" },
  "devDependencies": {
    "react": "^19.0.0", "react-dom": "^19.0.0", "@types/react": "^19.0.0",
    "@testing-library/react": "^16.0.0", "@testing-library/user-event": "^14.5.0",
    "fake-indexeddb": "^6.0.0", "jsdom": "^25.0.0",
    "vitest": "^2.1.0", "vitest-axe": "^0.1.0", "typescript": "^5.6.0"
  }
}
```

`packages/react/tsconfig.json`:
```json
{ "extends": "../../tsconfig.base.json", "compilerOptions": { "outDir": "dist", "jsx": "react-jsx" }, "include": ["src"] }
```

`packages/react/vitest.config.ts`:
```ts
import { defineConfig } from "vitest/config";
export default defineConfig({
  test: { environment: "jsdom", globals: true, setupFiles: ["./vitest.setup.ts"] },
});
```

`packages/react/vitest.setup.ts`:
```ts
import "fake-indexeddb/auto";
import "vitest-axe/extend-expect";
```

- [ ] **Step 2: Write the failing test**

`packages/react/src/idbStore.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { createIdbStore } from "./idbStore";
import type { Observation } from "@healthtwin/core";

const rec = (id: string): Observation => ({
  id, subjectId: "s", occurredAt: "2026-07-02T10:00:00.000Z", createdAt: "2026-07-02T10:00:00.000Z",
  location: { regionId: "knee", side: "left", view: "anterior" }, type: "pain",
  taxonomyVersion: "1.0.0", origin: "d",
});

describe("idb store", () => {
  it("persists appended records", async () => {
    const s = createIdbStore("test-db-1");
    await s.append(rec("A".repeat(26)));
    await s.append(rec("B".repeat(26)));
    const ids = (await s.all()).map((o) => o.id).sort();
    expect(ids).toEqual(["A".repeat(26), "B".repeat(26)]);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `pnpm --filter @healthtwin/react test`
Expected: FAIL — cannot find `./idbStore`.

- [ ] **Step 4: Write the store**

`packages/react/src/idbStore.ts`:
```ts
import { openDB, type IDBPDatabase } from "idb";
import type { LocalStore, Observation } from "@healthtwin/core";

const STORE = "observations";

async function db(name: string): Promise<IDBPDatabase> {
  return openDB(name, 1, {
    upgrade(d) {
      if (!d.objectStoreNames.contains(STORE)) d.createObjectStore(STORE, { keyPath: "id" });
    },
  });
}

export function createIdbStore(dbName = "healthtwin"): LocalStore {
  return {
    async all(): Promise<Observation[]> {
      const d = await db(dbName);
      return (await d.getAll(STORE)) as Observation[];
    },
    async append(record: Observation): Promise<void> {
      const d = await db(dbName);
      await d.put(STORE, record);
    },
  };
}
```

- [ ] **Step 5: Write the index**

`packages/react/src/index.ts`:
```ts
export * from "./idbStore";
```

- [ ] **Step 6: Run tests**

Run: `pnpm install && pnpm --filter @healthtwin/react test`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "feat(react): IndexedDB LocalStore implementation"
```

---

### Task 11: react — HealthTwinProvider & useObservations hook

**Files:**
- Create: `packages/react/src/HealthTwinProvider.tsx`, `packages/react/src/useObservations.ts`
- Modify: `packages/react/src/index.ts`
- Test: `packages/react/src/useObservations.test.tsx`

**Interfaces:**
- Consumes: `LocalStore`, `Observation`, `NewObservation`, `createObservation`, `foldLog`, `queryObservations`, `ObservationFilter` (`@healthtwin/core`).
- Produces:
  - `HealthTwinProvider: React.FC<{ store: LocalStore; subjectId: string; origin: string; children: React.ReactNode }>`
  - `useObservations(): { observations: Observation[]; add: (input: NewObservation) => Promise<void>; query: (f?: ObservationFilter) => Observation[]; loading: boolean; }` — `observations` is the folded live set, refreshed after `add`.

- [ ] **Step 1: Write the failing test**

`packages/react/src/useObservations.test.tsx`:
```tsx
import { describe, it, expect } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryStore } from "@healthtwin/core";
import { HealthTwinProvider } from "./HealthTwinProvider";
import { useObservations } from "./useObservations";

function Harness() {
  const { observations, add, loading } = useObservations();
  if (loading) return <p>loading</p>;
  return (
    <div>
      <button onClick={() => add({ location: { regionId: "knee", side: "left", view: "anterior" }, type: "pain", intensity: 5 })}>
        add
      </button>
      <p>count: {observations.length}</p>
    </div>
  );
}

describe("useObservations", () => {
  it("adds an observation and reflects it in the folded set", async () => {
    render(
      <HealthTwinProvider store={createMemoryStore()} subjectId="s" origin="d">
        <Harness />
      </HealthTwinProvider>,
    );
    await waitFor(() => screen.getByText("count: 0"));
    await userEvent.click(screen.getByText("add"));
    await waitFor(() => screen.getByText("count: 1"));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @healthtwin/react test`
Expected: FAIL — cannot find `./HealthTwinProvider`.

- [ ] **Step 3: Write the provider**

`packages/react/src/HealthTwinProvider.tsx`:
```tsx
import * as React from "react";
import type { LocalStore } from "@healthtwin/core";

export interface HealthTwinContextValue {
  store: LocalStore;
  subjectId: string;
  origin: string;
}

export const HealthTwinContext = React.createContext<HealthTwinContextValue | null>(null);

export const HealthTwinProvider: React.FC<{
  store: LocalStore;
  subjectId: string;
  origin: string;
  children: React.ReactNode;
}> = ({ store, subjectId, origin, children }) => (
  <HealthTwinContext.Provider value={{ store, subjectId, origin }}>
    {children}
  </HealthTwinContext.Provider>
);
```

- [ ] **Step 4: Write the hook**

`packages/react/src/useObservations.ts`:
```ts
import * as React from "react";
import {
  createObservation, foldLog, queryObservations,
  type Observation, type NewObservation, type ObservationFilter,
} from "@healthtwin/core";
import { HealthTwinContext } from "./HealthTwinProvider";

export function useObservations() {
  const ctx = React.useContext(HealthTwinContext);
  if (!ctx) throw new Error("useObservations must be used within HealthTwinProvider");
  const { store, subjectId, origin } = ctx;

  const [all, setAll] = React.useState<Observation[]>([]);
  const [loading, setLoading] = React.useState(true);

  const refresh = React.useCallback(async () => {
    setAll(await store.all());
    setLoading(false);
  }, [store]);

  React.useEffect(() => { void refresh(); }, [refresh]);

  const add = React.useCallback(async (input: NewObservation) => {
    const record = createObservation(input, { subjectId, origin });
    await store.append(record);
    await refresh();
  }, [store, subjectId, origin, refresh]);

  const observations = React.useMemo(() => foldLog(all), [all]);
  const query = React.useCallback(
    (f?: ObservationFilter) => queryObservations(observations, f),
    [observations],
  );

  return { observations, add, query, loading };
}
```

- [ ] **Step 5: Re-export**

Append to `packages/react/src/index.ts`:
```ts
export * from "./HealthTwinProvider";
export * from "./useObservations";
```

- [ ] **Step 6: Run tests**

Run: `pnpm --filter @healthtwin/react test`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "feat(react): HealthTwinProvider + useObservations hook"
```

---

### Task 12: react — EntrySheet form

**Files:**
- Create: `packages/react/src/EntrySheet.tsx`
- Modify: `packages/react/src/index.ts`
- Test: `packages/react/src/EntrySheet.test.tsx`

**Interfaces:**
- Consumes: `ObservationType`, `Quality`, `NewObservation`, `Side`, `BodyView` (`@healthtwin/core`).
- Produces:
  - `interface EntrySheetProps { regionId: string; regionLabel: string; side: Side; view: BodyView; point?: { x: number; y: number }; onSubmit: (input: NewObservation) => void; onCancel: () => void; }`
  - `EntrySheet: React.FC<EntrySheetProps>` — form with type select, quality chips, intensity slider (0–10), note, context tags; builds the `NewObservation.location` from props.

- [ ] **Step 1: Write the failing test**

`packages/react/src/EntrySheet.test.tsx`:
```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EntrySheet } from "./EntrySheet";

describe("EntrySheet", () => {
  it("submits a NewObservation for the region", async () => {
    const onSubmit = vi.fn();
    render(
      <EntrySheet regionId="knee" regionLabel="Left Knee" side="left" view="anterior"
        point={{ x: 0.5, y: 0.5 }} onSubmit={onSubmit} onCancel={() => {}} />,
    );
    await userEvent.selectOptions(screen.getByLabelText("Type"), "pain");
    await userEvent.clear(screen.getByLabelText("Intensity"));
    await userEvent.type(screen.getByLabelText("Intensity"), "7");
    await userEvent.type(screen.getByLabelText("Note"), "sore after PT");
    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "pain",
        intensity: 7,
        note: "sore after PT",
        location: { regionId: "knee", side: "left", view: "anterior", point: { x: 0.5, y: 0.5 } },
      }),
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @healthtwin/react test`
Expected: FAIL — cannot find `./EntrySheet`.

- [ ] **Step 3: Write the component**

`packages/react/src/EntrySheet.tsx`:
```tsx
import * as React from "react";
import type { NewObservation, ObservationType, Quality, Side, BodyView } from "@healthtwin/core";

export interface EntrySheetProps {
  regionId: string;
  regionLabel: string;
  side: Side;
  view: BodyView;
  point?: { x: number; y: number };
  onSubmit: (input: NewObservation) => void;
  onCancel: () => void;
}

const TYPES: ObservationType[] = ["pain", "stiffness", "numbness", "tingling", "swelling", "weakness", "other"];
const QUALITIES: Quality[] = ["sharp", "dull", "burning", "throbbing", "aching", "stabbing", "cramping"];

export const EntrySheet: React.FC<EntrySheetProps> = ({
  regionId, regionLabel, side, view, point, onSubmit, onCancel,
}) => {
  const [type, setType] = React.useState<ObservationType>("pain");
  const [quality, setQuality] = React.useState<Quality[]>([]);
  const [intensity, setIntensity] = React.useState(5);
  const [note, setNote] = React.useState("");
  const [tags, setTags] = React.useState("");

  const toggle = (q: Quality) =>
    setQuality((cur) => (cur.includes(q) ? cur.filter((x) => x !== q) : [...cur, q]));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const contextTags = tags.split(",").map((t) => t.trim()).filter(Boolean);
    onSubmit({
      location: { regionId, side, view, point },
      type,
      quality: quality.length ? quality : undefined,
      intensity,
      note: note.trim() || undefined,
      contextTags: contextTags.length ? contextTags : undefined,
    });
  };

  return (
    <form onSubmit={submit} aria-label={`Log symptom for ${regionLabel}`}>
      <h2>{regionLabel}</h2>

      <label htmlFor="type">Type</label>
      <select id="type" value={type} onChange={(e) => setType(e.target.value as ObservationType)}>
        {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
      </select>

      <fieldset>
        <legend>Quality</legend>
        {QUALITIES.map((q) => (
          <label key={q}>
            <input type="checkbox" checked={quality.includes(q)} onChange={() => toggle(q)} /> {q}
          </label>
        ))}
      </fieldset>

      <label htmlFor="intensity">Intensity</label>
      <input id="intensity" type="number" min={0} max={10}
        value={intensity} onChange={(e) => setIntensity(Number(e.target.value))} />

      <label htmlFor="note">Note</label>
      <textarea id="note" value={note} onChange={(e) => setNote(e.target.value)} />

      <label htmlFor="tags">Context tags (comma-separated)</label>
      <input id="tags" value={tags} onChange={(e) => setTags(e.target.value)} />

      <button type="submit">Save</button>
      <button type="button" onClick={onCancel}>Cancel</button>
    </form>
  );
};
```

- [ ] **Step 4: Re-export**

Append to `packages/react/src/index.ts`:
```ts
export * from "./EntrySheet";
```

- [ ] **Step 5: Run tests**

Run: `pnpm --filter @healthtwin/react test`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat(react): EntrySheet symptom capture form"
```

---

### Task 13: react — BodyMapCapture (compose map + sheet + persistence)

**Files:**
- Create: `packages/react/src/BodyMapCapture.tsx`
- Modify: `packages/react/src/index.ts`
- Test: `packages/react/src/BodyMapCapture.test.tsx`

**Interfaces:**
- Consumes: `BodyMap`, `BodyMapSelection` (`@healthtwin/bodymap-react`); `useObservations` (Task 11); `EntrySheet` (Task 12); `getRegion`, `BodyView` (`@healthtwin/core`).
- Produces:
  - `interface BodyMapCaptureProps { view?: BodyView }`
  - `BodyMapCapture: React.FC<BodyMapCaptureProps>` — shows the body map; on region select opens `EntrySheet`; on submit calls `useObservations().add` and closes the sheet.

- [ ] **Step 1: Write the failing test**

`packages/react/src/BodyMapCapture.test.tsx`:
```tsx
import { describe, it, expect } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryStore, type LocalStore } from "@healthtwin/core";
import { HealthTwinProvider } from "./HealthTwinProvider";
import { BodyMapCapture } from "./BodyMapCapture";

function wrap(store: LocalStore) {
  return render(
    <HealthTwinProvider store={store} subjectId="s" origin="d">
      <BodyMapCapture view="anterior" />
    </HealthTwinProvider>,
  );
}

describe("BodyMapCapture", () => {
  it("captures an observation end to end", async () => {
    const store = createMemoryStore();
    wrap(store);
    await userEvent.click(screen.getByLabelText("Left Knee"));  // opens sheet
    await userEvent.click(await screen.findByRole("button", { name: "Save" }));
    await waitFor(async () => expect((await store.all()).length).toBe(1));
    const saved = (await store.all())[0];
    expect(saved.location.regionId).toBe("knee");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @healthtwin/react test`
Expected: FAIL — cannot find `./BodyMapCapture`.

- [ ] **Step 3: Write the component**

`packages/react/src/BodyMapCapture.tsx`:
```tsx
import * as React from "react";
import { BodyMap, type BodyMapSelection } from "@healthtwin/bodymap-react";
import { getRegion, type BodyView } from "@healthtwin/core";
import { useObservations } from "./useObservations";
import { EntrySheet } from "./EntrySheet";

export interface BodyMapCaptureProps { view?: BodyView; }

export const BodyMapCapture: React.FC<BodyMapCaptureProps> = ({ view = "anterior" }) => {
  const { add } = useObservations();
  const [sel, setSel] = React.useState<BodyMapSelection | null>(null);

  return (
    <div>
      <BodyMap view={view} selectedKey={sel?.key} onSelect={setSel} />
      {sel && (
        <EntrySheet
          regionId={sel.regionId}
          regionLabel={getRegion(sel.regionId)?.label ?? sel.regionId}
          side={sel.side}
          view={sel.view}
          point={sel.point}
          onSubmit={async (input) => { await add(input); setSel(null); }}
          onCancel={() => setSel(null)}
        />
      )}
    </div>
  );
};
```

- [ ] **Step 4: Re-export**

Append to `packages/react/src/index.ts`:
```ts
export * from "./BodyMapCapture";
```

- [ ] **Step 5: Run tests**

Run: `pnpm --filter @healthtwin/react test`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat(react): BodyMapCapture end-to-end capture flow"
```

---

### Task 14: apps/web — Next.js app + entries list + Playwright E2E

**Files:**
- Create: `apps/web/package.json`, `apps/web/next.config.mjs`, `apps/web/tsconfig.json`, `apps/web/app/layout.tsx`, `apps/web/app/providers.tsx`, `apps/web/app/page.tsx`, `apps/web/src/EntriesList.tsx`
- Create: `apps/web/playwright.config.ts`, `apps/web/e2e/capture.spec.ts`
- Test: Playwright E2E (build + run).

**Interfaces:**
- Consumes: `HealthTwinProvider`, `BodyMapCapture`, `useObservations` (`@healthtwin/react`); `createIdbStore` (`@healthtwin/react`).
- Produces: a running Next.js app at `/` where a user captures and sees observations; a green Playwright flow.

- [ ] **Step 1: Create the Next.js app package**

`apps/web/package.json`:
```json
{
  "name": "@healthtwin/web",
  "version": "0.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "typecheck": "tsc --noEmit",
    "test": "playwright test"
  },
  "dependencies": {
    "@healthtwin/react": "workspace:*",
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@playwright/test": "^1.48.0",
    "@types/react": "^19.0.0",
    "typescript": "^5.6.0"
  }
}
```

`apps/web/next.config.mjs`:
```js
/** @type {import('next').NextConfig} */
export default { transpilePackages: ["@healthtwin/react", "@healthtwin/bodymap-react", "@healthtwin/bodymap-core", "@healthtwin/core"] };
```

`apps/web/tsconfig.json`:
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": { "jsx": "preserve", "noEmit": true, "plugins": [{ "name": "next" }] },
  "include": ["app", "src", "next-env.d.ts"]
}
```

- [ ] **Step 2: Create the app shell + provider (client-side store)**

`apps/web/app/providers.tsx`:
```tsx
"use client";
import * as React from "react";
import { HealthTwinProvider, createIdbStore } from "@healthtwin/react";

export function Providers({ children }: { children: React.ReactNode }) {
  // One local device identity for Phase 1 (persisted in localStorage).
  const [ids] = React.useState(() => {
    const get = (k: string) => {
      const cur = window.localStorage.getItem(k);
      if (cur) return cur;
      const v = crypto.randomUUID();
      window.localStorage.setItem(k, v);
      return v;
    };
    return { subjectId: get("ht_subject"), origin: get("ht_origin") };
  });
  const [store] = React.useState(() => createIdbStore("healthtwin"));
  return (
    <HealthTwinProvider store={store} subjectId={ids.subjectId} origin={ids.origin}>
      {children}
    </HealthTwinProvider>
  );
}
```

`apps/web/app/layout.tsx`:
```tsx
import * as React from "react";
import { Providers } from "./providers";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Create the entries list and the page**

`apps/web/src/EntriesList.tsx`:
```tsx
"use client";
import * as React from "react";
import { useObservations } from "@healthtwin/react";
import { getRegion } from "@healthtwin/core";

export function EntriesList() {
  const { observations } = useObservations();
  return (
    <section aria-label="Logged entries">
      <h2>Entries ({observations.length})</h2>
      <ul>
        {observations.map((o) => (
          <li key={o.id} data-testid="entry">
            {getRegion(o.location.regionId)?.label ?? o.location.regionId} — {o.type}
            {o.intensity != null ? ` (${o.intensity}/10)` : ""}
          </li>
        ))}
      </ul>
    </section>
  );
}
```

`apps/web/app/page.tsx`:
```tsx
"use client";
import * as React from "react";
import { BodyMapCapture } from "@healthtwin/react";
import { EntriesList } from "../src/EntriesList";

export default function Home() {
  return (
    <main style={{ maxWidth: 480, margin: "0 auto", padding: 16 }}>
      <h1>HealthTwin</h1>
      <BodyMapCapture view="anterior" />
      <EntriesList />
    </main>
  );
}
```

- [ ] **Step 4: Write the Playwright config + failing E2E**

`apps/web/playwright.config.ts`:
```ts
import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./e2e",
  webServer: { command: "pnpm build && pnpm start -p 3100", url: "http://localhost:3100", reuseExistingServer: false, timeout: 120_000 },
  use: { baseURL: "http://localhost:3100" },
});
```

`apps/web/e2e/capture.spec.ts`:
```ts
import { test, expect } from "@playwright/test";

test("capture a knee pain entry and see it listed", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Left Knee").click();
  await page.getByLabel("Type").selectOption("pain");
  await page.getByLabel("Intensity").fill("7");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByTestId("entry")).toHaveCount(1);
  await expect(page.getByTestId("entry")).toContainText("Knee");
});
```

- [ ] **Step 5: Run the E2E to verify it fails, then passes**

Run: `pnpm --filter @healthtwin/web exec playwright install --with-deps chromium`
Run: `pnpm --filter @healthtwin/web test`
Expected: after Steps 1–4 are in place, the flow is GREEN (1 entry, contains "Knee"). If the app isn't wired yet, it FAILS first — fix wiring until green.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat(web): Next.js capture page with entries list + Playwright E2E"
```

---

## Self-Review (author checklist — completed)

**Spec coverage:** 2D SVG named regions ✔ (Task 8/9) · optional x/y ✔ (`point`, Task 8/9/12) · rich entry model ✔ (Task 2/4/12) · local-first persistence ✔ (Task 10) · immutable event log ✔ (Task 5) · versioned taxonomy ✔ (Task 3) · query API ✔ (Task 6) · accessibility ✔ (Task 9 axe) · shared-core boundary ✔ (core has zero UI deps). Deferred by design (documented in spec §9 and this plan's phase table): sync/backend, heatmap/timeline review UI, native, embed, security/RLS.

**Placeholder scan:** No TBD/TODO; every code step contains complete code; SVG geometry uses concrete placeholder rects with an explicit note to swap in licensed anatomy art later (a real, runnable stand-in, not a placeholder gap).

**Type consistency:** `regionKey` format `regionId:side:view` used identically in Task 3, 8, 9. `LocalStore` (`all`/`append`) consistent in Task 7, 10, 11. `NewObservation`/`createObservation`/`ObservationContext` consistent in Task 4, 11, 12, 13. `BodyMapSelection` produced in Task 9 consumed in Task 13.

---

## Phase 1 Definition of Done

- `pnpm -w test` green across `core`, `bodymap-core`, `bodymap-react`, `react`.
- `pnpm --filter @healthtwin/web test` (Playwright) green.
- Manual: `pnpm --filter @healthtwin/web dev`, tap a region, log a symptom, reload the page — the entry persists (IndexedDB).
