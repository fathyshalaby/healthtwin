import { describe, it, expect } from "vitest";
import { createSqliteSampleStore } from "./sqliteSampleStore";
import type { SqlDb } from "./sqlDb";
import type { Sample } from "@healthtwin/vitals";

const smp = (id: string, value = 1000): Sample => ({
  id, subjectId: "s", kind: "steps", value, unit: "count",
  at: "2026-07-02T10:00:00.000Z", source: "healthkit",
});

// In-memory SqlDb honoring exactly the statements createSqliteSampleStore issues.
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
      if (sql.includes("select data from samples")) {
        return [...rows.values()].map((data) => ({ data })) as T[];
      }
      throw new Error(`unsupported query: ${sql}`);
    },
  };
}

const A = "A".repeat(26);
const B = "B".repeat(26);

describe("sqlite sample store", () => {
  it("persists and reads samples as JSON rows", async () => {
    const store = await createSqliteSampleStore(fakeSqlDb());
    expect(await store.all()).toEqual([]);
    await store.append(smp(A));
    await store.append(smp(B));
    expect((await store.all()).map((s) => s.id).sort()).toEqual([A, B]);
  });

  it("upserts by id (insert or replace)", async () => {
    const store = await createSqliteSampleStore(fakeSqlDb());
    await store.append(smp(A, 1000));
    await store.append(smp(A, 2000));
    const all = await store.all();
    expect(all).toHaveLength(1);
    expect(all[0].value).toBe(2000);
  });
});
