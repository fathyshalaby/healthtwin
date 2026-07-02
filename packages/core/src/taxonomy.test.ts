import { describe, it, expect } from "vitest";
import { REGIONS, getRegion, regionKey, TAXONOMY_VERSION } from "./taxonomy";

describe("taxonomy", () => {
  it("has a version and a non-empty region set", () => {
    expect(TAXONOMY_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
    expect(REGIONS.length).toBeGreaterThan(0);
  });
  it("every region id is unique", () => {
    const ids = REGIONS.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
  it("getRegion finds by id and returns undefined otherwise", () => {
    expect(getRegion("knee")?.label).toBe("Knee");
    expect(getRegion("nope")).toBeUndefined();
  });
  it("regionKey formats regionId:side:view", () => {
    expect(regionKey({ regionId: "knee", side: "left", view: "anterior" }))
      .toBe("knee:left:anterior");
  });
});
