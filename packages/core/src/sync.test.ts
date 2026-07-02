import { describe, it, expect } from "vitest";
import { runSync, createMemorySyncMeta, type SyncAdapter } from "./sync";
import { createMemoryStore } from "./store";
import type { Observation, ULID } from "./types";

const obs = (id: ULID): Observation => ({
  id, subjectId: "s", occurredAt: "2026-07-02T10:00:00.000Z", createdAt: "2026-07-02T10:00:00.000Z",
  location: { regionId: "knee", side: "left", view: "anterior" }, type: "pain",
  taxonomyVersion: "1.0.0", origin: "d",
});

// Shared fake backend: append-only, cursor is the record count.
function createFakeRemote() {
  const records: Observation[] = [];
  const adapter: SyncAdapter = {
    async push(recs) {
      const acked: ULID[] = [];
      for (const r of recs) {
        if (!records.some((x) => x.id === r.id)) records.push(r);
        acked.push(r.id);
      }
      return { acked };
    },
    async pull(cursor) {
      const start = cursor ? Number(cursor) : 0;
      return { records: records.slice(start), cursor: String(records.length) };
    },
  };
  return { adapter, records };
}

const A = "A".repeat(26);
const B = "B".repeat(26);

describe("runSync", () => {
  it("pushes local records to the remote", async () => {
    const { adapter, records } = createFakeRemote();
    const store = createMemoryStore();
    const meta = createMemorySyncMeta();
    await store.append(obs(A));
    await store.append(obs(B));

    const res = await runSync(store, meta, adapter);

    expect(res.pushed).toBe(2);
    expect(records.map((r) => r.id).sort()).toEqual([A, B]);
  });

  it("pulls remote records into a second device", async () => {
    const { adapter } = createFakeRemote();
    const sA = createMemoryStore();
    const mA = createMemorySyncMeta();
    await sA.append(obs(A));
    await runSync(sA, mA, adapter);

    const sB = createMemoryStore();
    const mB = createMemorySyncMeta();
    const res = await runSync(sB, mB, adapter);

    expect(res.pulled).toBe(1);
    expect((await sB.all()).map((o) => o.id)).toEqual([A]);
  });

  it("is idempotent — a second sync pushes and pulls nothing new", async () => {
    const { adapter } = createFakeRemote();
    const store = createMemoryStore();
    const meta = createMemorySyncMeta();
    await store.append(obs(A));
    await runSync(store, meta, adapter);

    const res = await runSync(store, meta, adapter);

    expect(res).toEqual({ pushed: 0, pulled: 0 });
  });
});
