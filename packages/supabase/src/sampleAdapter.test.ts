import { describe, it, expect } from "vitest";
import { createSampleCloudAdapter } from "./sampleAdapter";
import { toSampleRow, type Sample } from "@healthtwin/vitals";

const smp = (id: string): Sample => ({
  id,
  subjectId: "11111111-1111-1111-1111-111111111111",
  kind: "steps",
  value: 1000,
  unit: "count",
  at: "2026-07-02T10:00:00.000Z",
  source: "test",
});

type Call = [string, ...unknown[]];

// A chainable, awaitable stand-in for the supabase-js query builder.
function mockClient(result: unknown) {
  const calls: Call[] = [];
  const q: Record<string, unknown> = {};
  for (const m of ["upsert", "select", "gt", "order", "limit"]) {
    q[m] = (...args: unknown[]) => { calls.push([m, ...args]); return q; };
  }
  (q as { then: (r: (v: unknown) => void) => Promise<void> }).then = (r) =>
    Promise.resolve(result).then(r);
  const client = { from: (t: string) => { calls.push(["from", t]); return q; } };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return { client: client as any, calls };
}

const A = "A".repeat(26);

describe("sample cloud adapter", () => {
  it("push upserts mapped sample rows into the samples table and acks all ids", async () => {
    const { client, calls } = mockClient({ data: [], error: null });
    const res = await createSampleCloudAdapter(client).push([smp(A)]);
    expect(res.acked).toEqual([A]);
    expect(calls.find((c) => c[0] === "from")?.[1]).toBe("samples");
    expect(calls.find((c) => c[0] === "upsert")?.[1]).toEqual([toSampleRow(smp(A))]);
  });

  it("pull maps rows back and advances the cursor to the last seq", async () => {
    const row = { ...toSampleRow(smp(A)), seq: 9 };
    const { client } = mockClient({ data: [row], error: null });
    const page = await createSampleCloudAdapter(client).pull(undefined);
    expect(page.records.map((r) => r.id)).toEqual([A]);
    expect(page.cursor).toBe("9");
  });

  it("push throws on a supabase error", async () => {
    const { client } = mockClient({ data: null, error: { message: "boom" } });
    await expect(createSampleCloudAdapter(client).push([smp(A)])).rejects.toThrow("boom");
  });
});
