import { describe, it, expect } from "vitest";
import { regionStats, detectFlares, contextCorrelations, currentStreak, summarize } from "./engine";
import type { Observation } from "@healthtwin/core";

let seq = 0;
const mk = (over: Partial<Observation>): Observation => ({
  id: String(seq++).padStart(26, "A"),
  subjectId: "s",
  occurredAt: "2026-07-02T10:00:00.000Z",
  createdAt: "2026-07-02T10:00:00.000Z",
  location: { regionId: "knee", side: "left", view: "anterior" },
  type: "pain",
  taxonomyVersion: "1.1.0",
  origin: "d",
  ...over,
});

describe("regionStats", () => {
  it("computes counts, mean, and a worsening trend", () => {
    const rows = [
      mk({ occurredAt: "2026-07-01T10:00:00.000Z", intensity: 2 }),
      mk({ occurredAt: "2026-07-02T10:00:00.000Z", intensity: 3 }),
      mk({ occurredAt: "2026-07-03T10:00:00.000Z", intensity: 8 }),
      mk({ occurredAt: "2026-07-04T10:00:00.000Z", intensity: 9 }),
    ];
    const [knee] = regionStats(rows);
    expect(knee.count).toBe(4);
    expect(knee.maxIntensity).toBe(9);
    expect(knee.trend).toBe("worsening");
  });
});

describe("detectFlares", () => {
  it("flags entries ≥ 7/10", () => {
    const flares = detectFlares([mk({ intensity: 5 }), mk({ intensity: 8 })]);
    expect(flares).toHaveLength(1);
    expect(flares[0].intensity).toBe(8);
  });
});

describe("contextCorrelations", () => {
  it("averages intensity per context tag", () => {
    const c = contextCorrelations([
      mk({ intensity: 6, contextTags: ["after-PT"] }),
      mk({ intensity: 8, contextTags: ["after-PT"] }),
    ]);
    expect(c[0]).toMatchObject({ tag: "after-PT", count: 2, meanIntensity: 7 });
  });
});

describe("currentStreak", () => {
  it("counts consecutive days", () => {
    expect(currentStreak([
      mk({ occurredAt: "2026-07-01T09:00:00.000Z" }),
      mk({ occurredAt: "2026-07-02T09:00:00.000Z" }),
      mk({ occurredAt: "2026-07-03T09:00:00.000Z" }),
    ])).toBe(3);
  });
  it("breaks on a gap", () => {
    expect(currentStreak([
      mk({ occurredAt: "2026-07-01T09:00:00.000Z" }),
      mk({ occurredAt: "2026-07-03T09:00:00.000Z" }),
    ])).toBe(1);
  });
});

describe("summarize", () => {
  it("rolls region stats, flares, and types into one object", () => {
    const s = summarize([
      mk({ occurredAt: "2026-07-01T10:00:00.000Z", intensity: 2, type: "pain" }),
      mk({ occurredAt: "2026-07-02T10:00:00.000Z", intensity: 8, type: "pain", contextTags: ["after-PT"] }),
      mk({ occurredAt: "2026-07-02T11:00:00.000Z", type: "stiffness", location: { regionId: "chest", side: "central", view: "anterior" } }),
    ]);
    expect(s.total).toBe(3);
    expect(s.activeRegions).toBe(2);
    expect(s.byType).toMatchObject({ pain: 2, stiffness: 1 });
    expect(s.flares).toHaveLength(1);
    expect(s.topRegions[0].label).toBe("Left Knee");
  });
});
