import { describe, it, expect } from "vitest";
import { shapesFor, normalizedPoint } from "./geometry";

describe("geometry", () => {
  it("anterior view includes a knee shape with a valid key", () => {
    const keys = shapesFor("anterior").map((s) => s.key);
    expect(keys).toContain("knee:left:anterior");
  });
  it("normalizedPoint maps into [0,1] and clamps", () => {
    const bbox = { x: 100, y: 200, w: 50, h: 50 };
    expect(normalizedPoint(bbox, 125, 225)).toEqual({ x: 0.5, y: 0.5 });
    expect(normalizedPoint(bbox, 0, 0)).toEqual({ x: 0, y: 0 });
    expect(normalizedPoint(bbox, 9999, 9999)).toEqual({ x: 1, y: 1 });
  });
});
