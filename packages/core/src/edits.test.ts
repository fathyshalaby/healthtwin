import { describe, it, expect } from "vitest";
import { createObservation, editObservation, tombstoneObservation } from "./schema";
import { foldLog } from "./log";

const ctx = { subjectId: "s", origin: "d" };
const loc = { regionId: "knee", side: "left", view: "anterior" } as const;

describe("editObservation", () => {
  it("supersedes the previous record and applies the patch", () => {
    const a = createObservation({ location: loc, type: "pain", intensity: 3 }, ctx);
    const b = editObservation(a, { intensity: 8 }, ctx);
    expect(b.supersedes).toBe(a.id);
    expect(b.intensity).toBe(8);
    expect(b.id).not.toBe(a.id);
    expect(foldLog([a, b]).map((o) => o.id)).toEqual([b.id]);
  });
});

describe("tombstoneObservation", () => {
  it("removes the entry from the folded log", () => {
    const a = createObservation({ location: loc, type: "pain" }, ctx);
    const t = tombstoneObservation(a, ctx);
    expect(t.tombstone).toBe(true);
    expect(t.supersedes).toBe(a.id);
    expect(foldLog([a, t])).toEqual([]);
  });
});
