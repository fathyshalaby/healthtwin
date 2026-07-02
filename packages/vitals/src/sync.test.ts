import { describe, it, expect } from "vitest";
import { createSample } from "./schema";
import { createMemorySampleStore } from "./store";
import { runSampleSync, createMemorySampleSyncMeta, type SampleSyncAdapter } from "./sync";
import type { Sample } from "./types";

// A memory "server" with a monotonic seq, mirroring the samples table.
function memoryServer() {
  const rows: { s: Sample; seq: number }[] = [];
  let seq = 0;
  const adapter: SampleSyncAdapter = {
    async push(records) {
      for (const r of records) if (!rows.some((x) => x.s.id === r.id)) rows.push({ s: r, seq: ++seq });
      return { acked: records.map((r) => r.id) };
    },
    async pull(cursor) {
      const from = cursor ? Number(cursor) : 0;
      const page = rows.filter((x) => x.seq > from).sort((a, b) => a.seq - b.seq);
      return { records: page.map((x) => x.s), cursor: page.length ? String(page[page.length - 1].seq) : cursor };
    },
  };
  return { adapter };
}

const mk = () => createSample({ kind: "steps", value: 1000, unit: "count", at: "2026-07-01T00:00:00Z" }, { subjectId: "u1" });

describe("runSampleSync", () => {
  it("pushes local, pulls to a second device, and is idempotent", async () => {
    const { adapter } = memoryServer();
    const A = createMemorySampleStore(), Am = createMemorySampleSyncMeta();
    const B = createMemorySampleStore(), Bm = createMemorySampleSyncMeta();
    const s1 = mk();
    await A.append(s1);

    expect(await runSampleSync(A, Am, adapter)).toEqual({ pushed: 1, pulled: 0 });
    expect(await runSampleSync(B, Bm, adapter)).toEqual({ pushed: 0, pulled: 1 });
    expect((await B.all()).map((s) => s.id)).toEqual([s1.id]);

    // Re-syncing changes nothing: pulled ids are not re-pushed.
    expect(await runSampleSync(A, Am, adapter)).toEqual({ pushed: 0, pulled: 0 });
    expect(await runSampleSync(B, Bm, adapter)).toEqual({ pushed: 0, pulled: 0 });
  });

  it("does not duplicate a sample already present locally", async () => {
    const { adapter } = memoryServer();
    const A = createMemorySampleStore(), Am = createMemorySampleSyncMeta();
    const s1 = mk();
    await A.append(s1);
    await A.append(s1); // same id
    await runSampleSync(A, Am, adapter);
    expect(await A.all()).toHaveLength(1);
  });
});
