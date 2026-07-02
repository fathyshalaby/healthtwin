import { describe, it, expect } from "vitest";
import { createObservation } from "./schema";

const ctx = { subjectId: "subj_1", origin: "device_1" };

describe("createObservation", () => {
  it("builds a valid observation with generated fields", () => {
    const o = createObservation(
      { location: { regionId: "knee", side: "left", view: "anterior" }, type: "pain", intensity: 6 },
      ctx,
    );
    expect(o.id).toMatch(/^[0-9A-HJKMNP-TV-Z]{26}$/);
    expect(o.subjectId).toBe("subj_1");
    expect(o.taxonomyVersion).toBe("1.1.0");
    expect(o.occurredAt).toBe(o.createdAt); // default
    expect(o.intensity).toBe(6);
  });
  it("rejects intensity out of range", () => {
    expect(() =>
      createObservation(
        { location: { regionId: "knee", side: "left", view: "anterior" }, type: "pain", intensity: 99 },
        ctx,
      ),
    ).toThrow();
  });
  it("rejects an unknown region", () => {
    expect(() =>
      createObservation(
        { location: { regionId: "wing", side: "left", view: "anterior" }, type: "pain" },
        ctx,
      ),
    ).toThrow(/region/i);
  });
});
