import { describe, it, expect } from "vitest";
import { fromSampleRow, toSampleRow } from "./rowMapping";
import { createSample } from "./schema";

describe("row mapping", () => {
  it("round-trips a sample through the row shape", () => {
    const s = createSample({ kind: "heart_rate", value: 62, unit: "bpm", at: "2026-07-01T08:00:00.000Z" }, { subjectId: "u1" });
    expect(fromSampleRow(toSampleRow(s))).toMatchObject({ id: s.id, kind: "heart_rate", value: 62, unit: "bpm" });
  });

  it("coerces an unknown DB kind to 'other' rather than misclassifying it", () => {
    const row = { id: "x".repeat(26), subject_id: "u1", kind: "blood_glucose", value: 5, unit: "mmol/L", at: "2026-07-01T08:00:00.000Z", source: "lab" };
    expect(fromSampleRow(row).kind).toBe("other");
  });
});
