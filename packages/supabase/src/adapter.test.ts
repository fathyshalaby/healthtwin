import { describe, it, expect } from "vitest";
import { createCloudAdapter } from "./adapter";
import { toRow } from "./rowMapping";
import type { Observation } from "@healthtwin/core";

const obs = (id: string): Observation => ({
  id,
  subjectId: "11111111-1111-1111-1111-111111111111",
  occurredAt: "2026-07-02T10:00:00.000Z",
  createdAt: "2026-07-02T10:00:00.000Z",
  location: { regionId: "knee", side: "left", view: "anterior" },
  type: "pain",
  taxonomyVersion: "1.0.0",
  origin: "d",
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

describe("cloud adapter", () => {
  it("push upserts mapped rows and acks all ids", async () => {
    const { client, calls } = mockClient({ data: [], error: null });
    const res = await createCloudAdapter(client).push([obs(A)]);
    expect(res.acked).toEqual([A]);
    const upsert = calls.find((c) => c[0] === "upsert");
    expect(upsert?.[1]).toEqual([toRow(obs(A))]);
  });

  it("pull maps rows back and advances the cursor to the last seq", async () => {
    const row = { ...toRow(obs(A)), seq: 7 };
    const { client } = mockClient({ data: [row], error: null });
    const page = await createCloudAdapter(client).pull(undefined);
    expect(page.records.map((r) => r.id)).toEqual([A]);
    expect(page.cursor).toBe("7");
  });

  it("push throws on a supabase error", async () => {
    const { client } = mockClient({ data: null, error: { message: "boom" } });
    await expect(createCloudAdapter(client).push([obs(A)])).rejects.toThrow("boom");
  });
});
