import { describe, it, expect } from "vitest";
import { computeHeatmap, buildTimeline } from "./query";
import type { Observation } from "./types";

const mk = (id: string, over: Partial<Observation>): Observation => ({
  id, subjectId: "s", occurredAt: "2026-07-02T10:00:00.000Z", createdAt: "2026-07-02T10:00:00.000Z",
  location: { regionId: "knee", side: "left", view: "anterior" }, type: "pain",
  taxonomyVersion: "1.0.0", origin: "d", ...over,
});

describe("computeHeatmap", () => {
  it("counts frequency per region key", () => {
    const h = computeHeatmap(
      [mk("a", {}), mk("b", {}), mk("c", { location: { regionId: "chest", side: "central", view: "anterior" } })],
      { metric: "frequency" },
    );
    expect(h.get("knee:left:anterior")).toBe(2);
    expect(h.get("chest:central:anterior")).toBe(1);
  });

  it("averages intensity per region key", () => {
    const h = computeHeatmap([mk("a", { intensity: 4 }), mk("b", { intensity: 8 })], { metric: "meanIntensity" });
    expect(h.get("knee:left:anterior")).toBe(6);
  });
});

describe("buildTimeline", () => {
  it("groups by day, newest day and item first", () => {
    const days = buildTimeline([
      mk("A", { occurredAt: "2026-07-01T09:00:00.000Z" }),
      mk("B", { occurredAt: "2026-07-02T09:00:00.000Z" }),
    ]);
    expect(days.map((d) => d.date)).toEqual(["2026-07-02", "2026-07-01"]);
    expect(days[0].items[0].id).toBe("B");
  });
});
