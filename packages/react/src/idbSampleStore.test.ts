import { describe, it, expect } from "vitest";
import { createIdbSampleStore } from "./idbSampleStore";
import type { Sample } from "@healthtwin/vitals";

const smp = (id: string, value = 1000): Sample => ({
  id, subjectId: "s", kind: "steps", value, unit: "count",
  at: "2026-07-02T10:00:00.000Z", source: "healthkit",
});

describe("idb sample store", () => {
  it("persists appended samples", async () => {
    const s = createIdbSampleStore("test-vitals-1");
    await s.append(smp("A".repeat(26)));
    await s.append(smp("B".repeat(26)));
    expect((await s.all()).map((x) => x.id).sort()).toEqual(["A".repeat(26), "B".repeat(26)]);
  });

  it("upserts by id", async () => {
    const s = createIdbSampleStore("test-vitals-2");
    await s.append(smp("A".repeat(26), 1000));
    await s.append(smp("A".repeat(26), 2000));
    const all = await s.all();
    expect(all).toHaveLength(1);
    expect(all[0].value).toBe(2000);
  });
});
