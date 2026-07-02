import { describe, it, expect } from "vitest";
import { createSqliteStore } from "./sqliteStore";
import type { SqlDb } from "./sqlDb";
import type { Observation } from "@healthtwin/core";

const obs = (id: string): Observation => ({
  id, subjectId: "s", occurredAt: "2026-07-02T10:00:00.000Z", createdAt: "2026-07-02T10:00:00.000Z",
  location: { regionId: "knee", side: "left", view: "anterior" }, type: "pain",
  taxonomyVersion: "1.0.0", origin: "d",
});

// In-memory SqlDb honoring exactly the statements createSqliteStore issues.
function fakeSqlDb(): SqlDb {
  const rows = new Map<string, string>();
  return {
    async exec(sql, params) {
      if (sql.startsWith("create table")) return;
      if (sql.startsWith("insert or replace")) {
        const [id, data] = params as [string, string];
        rows.set(id, data);
        return;
      }
      throw new Error(`unsupported exec: ${sql}`);
    },
    async query<T>(sql: string): Promise<T[]> {
      if (sql.includes("select data from observations")) {
        return [...rows.values()].map((data) => ({ data })) as T[];
      }
      throw new Error(`unsupported query: ${sql}`);
    },
  };
}

const A = "A".repeat(26);
const B = "B".repeat(26);

describe("sqlite store", () => {
  it("persists and reads observations as JSON rows", async () => {
    const store = await createSqliteStore(fakeSqlDb());
    expect(await store.all()).toEqual([]);
    await store.append(obs(A));
    await store.append(obs(B));
    expect((await store.all()).map((o) => o.id).sort()).toEqual([A, B]);
  });

  it("upserts by id (insert or replace)", async () => {
    const store = await createSqliteStore(fakeSqlDb());
    await store.append({ ...obs(A), intensity: 3 });
    await store.append({ ...obs(A), intensity: 9 });
    const all = await store.all();
    expect(all).toHaveLength(1);
    expect(all[0].intensity).toBe(9);
  });
});
