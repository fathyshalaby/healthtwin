import { describe, it, expect } from "vitest";
import { createSample } from "./schema";
import { dailySeries, latest, querySamples } from "./query";

const mk = (kind: Parameters<typeof createSample>[0]["kind"], value: number, iso: string) =>
  createSample({ kind, value, unit: "x", at: iso }, { subjectId: "u1" });

describe("query", () => {
  it("sums counter kinds per day and means others", () => {
    const steps = [mk("steps", 100, "2026-07-01T08:00:00Z"), mk("steps", 150, "2026-07-01T20:00:00Z")];
    expect(dailySeries(steps, "steps")).toEqual([{ date: "2026-07-01", value: 250 }]);

    const hr = [mk("heart_rate", 60, "2026-07-01T08:00:00Z"), mk("heart_rate", 80, "2026-07-01T20:00:00Z")];
    expect(dailySeries(hr, "heart_rate")).toEqual([{ date: "2026-07-01", value: 70 }]);
  });

  it("finds the latest reading of a kind", () => {
    const s = [mk("weight", 70, "2026-07-01T08:00:00Z"), mk("weight", 69, "2026-07-03T08:00:00Z")];
    expect(latest(s, "weight")?.value).toBe(69);
  });

  it("filters by kind and range", () => {
    const s = [mk("steps", 1, "2026-07-01T08:00:00Z"), mk("heart_rate", 60, "2026-07-02T08:00:00Z")];
    expect(querySamples(s, { kind: "steps" })).toHaveLength(1);
    expect(querySamples(s, { from: "2026-07-02T00:00:00Z" })).toHaveLength(1);
  });
});
