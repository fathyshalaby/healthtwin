import { describe, it, expect } from "vitest";
import { fromHealthKit, fromGoogleFit } from "./ingest";

describe("fromHealthKit", () => {
  it("maps known types and drops unknown ones", () => {
    const out = fromHealthKit(
      [
        { type: "HKQuantityTypeIdentifierHeartRate", value: 62, startDate: "2026-07-01T08:00:00.000Z", sourceName: "Apple Watch" },
        { type: "HKQuantityTypeIdentifierStepCount", value: 900, startDate: "2026-07-01T09:00:00.000Z" },
        { type: "HKQuantityTypeIdentifierUnknownThing", value: 1, startDate: "2026-07-01T10:00:00.000Z" },
      ],
      { subjectId: "u1" },
    );
    expect(out).toHaveLength(2);
    expect(out[0]).toMatchObject({ kind: "heart_rate", unit: "bpm", value: 62, source: "Apple Watch" });
    expect(out[1]).toMatchObject({ kind: "steps", unit: "count", source: "healthkit" });
  });

  it("does NOT map sleep analysis (its value is a stage code, not minutes)", () => {
    const out = fromHealthKit(
      [{ type: "HKCategoryTypeIdentifierSleepAnalysis", value: 1, startDate: "2026-07-01T23:00:00.000Z" }],
      { subjectId: "u1" },
    );
    expect(out).toHaveLength(0);
  });
});

describe("fromGoogleFit", () => {
  it("maps points and converts nanos to ISO", () => {
    const out = fromGoogleFit(
      [
        { dataTypeName: "com.google.step_count.delta", value: [{ intVal: 1200 }], startTimeNanos: "1751356800000000000" },
        { dataTypeName: "com.google.nope", value: [{ fpVal: 5 }], startTimeNanos: "1751356800000000000" },
      ],
      { subjectId: "u1" },
    );
    expect(out).toHaveLength(1);
    expect(out[0].kind).toBe("steps");
    expect(out[0].value).toBe(1200);
    expect(out[0].at).toBe("2025-07-01T08:00:00.000Z"); // 1751356800e9 ns
    expect(out[0].source).toBe("googlefit");
  });
});
