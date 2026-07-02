import { describe, it, expect } from "vitest";
import { createSample, SampleSchema } from "./schema";

describe("createSample", () => {
  it("fills id and defaults source, and validates", () => {
    const s = createSample({ kind: "steps", value: 1200, unit: "count" }, { subjectId: "u1" });
    expect(s.id).toHaveLength(26);
    expect(s.subjectId).toBe("u1");
    expect(s.source).toBe("manual");
    expect(() => SampleSchema.parse(s)).not.toThrow();
  });

  it("prefers explicit source and at", () => {
    const s = createSample(
      { kind: "heart_rate", value: 62, unit: "bpm", at: "2026-07-01T08:00:00.000Z", source: "watch" },
      { subjectId: "u1", source: "healthkit" },
    );
    expect(s.source).toBe("watch");
    expect(s.at).toBe("2026-07-01T08:00:00.000Z");
  });

  it("rejects a non-finite value", () => {
    expect(() => createSample({ kind: "weight", value: Infinity, unit: "kg" }, { subjectId: "u1" })).toThrow();
  });
});
