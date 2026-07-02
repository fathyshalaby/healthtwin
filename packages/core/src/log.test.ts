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
