import { describe, it, expect } from "vitest";
import { cohortSummary } from "./cohort";
import type { Observation } from "@healthtwin/core";

let seq = 0;
const mk = (subjectId: string, over: Partial<Observation>): Observation => ({
  id: String(seq++).padStart(26, "A"), subjectId,
  occurredAt: "2026-07-02T10:00:00.000Z", createdAt: "2026-07-02T10:00:00.000Z",
  location: { regionId: "knee", side: "left", view: "anterior" }, type: "pain",
  taxonomyVersion: "1.1.0", origin: "d", ...over,
});

describe("cohortSummary", () => {
  it("aggregates across subjects and flags active users", () => {
    const s = cohortSummary(
      [
        mk("u1", { occurredAt: "2026-07-02T10:00:00.000Z" }),
        mk("u1", { occurredAt: "2026-07-02T11:00:00.000Z" }),
        mk("u2", { occurredAt: "2026-01-01T10:00:00.000Z" }), // outside the 30d window
      ],
      { now: "2026-07-02T12:00:00.000Z", activeWindowDays: 30 },
    );

    expect(s.users).toBe(2);
    expect(s.totalEntries).toBe(3);
    expect(s.activeUsers).toBe(1); // only u1 is recent
    expect(s.meanEntriesPerUser).toBeCloseTo(1.5);
    expect(s.topRegions[0].label).toBe("Left Knee");
    expect(s.byType).toMatchObject({ pain: 3 });
  });
});
