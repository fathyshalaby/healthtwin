import { describe, it, expect } from "vitest";
import type { Observation } from "@healthtwin/core";
import { createSample } from "./schema";
import { correlateSymptomWithMetric } from "./correlate";

let seq = 0;
const obs = (occurredAt: string, intensity: number): Observation => ({
  id: String(seq++).padStart(26, "A"), subjectId: "u1",
  occurredAt, createdAt: occurredAt,
  location: { regionId: "knee", side: "left", view: "anterior" },
  type: "pain", intensity, taxonomyVersion: "1.1.0", origin: "d",
});
const sleep = (iso: string, minutes: number) =>
  createSample({ kind: "sleep_minutes", value: minutes, unit: "min", at: iso }, { subjectId: "u1" });

describe("correlateSymptomWithMetric", () => {
  it("computes Pearson over shared days and ignores days without a metric", () => {
    const observations = [
      obs("2026-07-01T10:00:00Z", 2),
      obs("2026-07-02T10:00:00Z", 4),
      obs("2026-07-03T10:00:00Z", 6),
      obs("2026-06-01T10:00:00Z", 9), // no matching sample → dropped
    ];
    const samples = [
      sleep("2026-07-01T23:00:00Z", 300),
      sleep("2026-07-02T23:00:00Z", 400),
      sleep("2026-07-03T23:00:00Z", 500),
    ];
    const c = correlateSymptomWithMetric(observations, samples, "sleep_minutes");
    expect(c.n).toBe(3);
    expect(c.pearson).toBeCloseTo(1, 5);
  });

  it("returns null Pearson with fewer than two overlapping days", () => {
    const c = correlateSymptomWithMetric([obs("2026-07-01T10:00:00Z", 5)], [sleep("2026-07-01T23:00:00Z", 300)], "sleep_minutes");
    expect(c.n).toBe(1);
    expect(c.pearson).toBeNull();
  });
});
