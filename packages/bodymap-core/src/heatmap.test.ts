import { describe, it, expect } from "vitest";
import { normalize, heatColor, shadingFor } from "./heatmap";

describe("heatmap math", () => {
  it("normalizes min to 0 and max to 1", () => {
    const n = normalize(new Map([["a", 2], ["b", 10]]));
    expect(n.get("a")).toBe(0);
    expect(n.get("b")).toBe(1);
  });

  it("maps equal values all to 1", () => {
    const n = normalize(new Map([["a", 5], ["b", 5]]));
    expect(n.get("a")).toBe(1);
    expect(n.get("b")).toBe(1);
  });

  it("heatColor returns an hsl string within range", () => {
    expect(heatColor(0)).toBe("hsl(210, 85%, 55%)");
    expect(heatColor(1)).toBe("hsl(0, 85%, 55%)");
  });

  it("shadingFor produces a color per key", () => {
    const s = shadingFor(new Map([["a", 1], ["b", 3]]));
    expect(s.get("a")).toMatch(/^hsl\(/);
    expect(s.get("b")).toMatch(/^hsl\(/);
  });
});
