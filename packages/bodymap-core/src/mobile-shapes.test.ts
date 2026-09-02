import { readFileSync } from "node:fs";
import { describe, it, expect } from "vitest";
import { shapesFor, VIEWBOX } from "./geometry";

const data = JSON.parse(
  readFileSync(new URL("../../mobile/shapes.json", import.meta.url), "utf8"),
) as {
  viewBox: { w: number; h: number };
  shapes: { key: string; label: string; view: "anterior" | "posterior"; primitive: { kind: string; cx?: number; cy?: number; rx?: number; ry?: number; x?: number; y?: number; w?: number; h?: number } }[];
};

function bbox(p: (typeof data.shapes)[0]["primitive"]) {
  if (p.kind === "ellipse") {
    return { x: (p.cx ?? 0) - (p.rx ?? 0), y: (p.cy ?? 0) - (p.ry ?? 0), w: (p.rx ?? 0) * 2, h: (p.ry ?? 0) * 2 };
  }
  return { x: p.x ?? 0, y: p.y ?? 0, w: p.w ?? 0, h: p.h ?? 0 };
}

describe("mobile shapes.json matches web geometry", () => {
  it("shares the viewBox", () => {
    expect(data.viewBox).toEqual(VIEWBOX);
  });

  it("has the same keys, labels, and bboxes as shapesFor()", () => {
    for (const view of ["anterior", "posterior"] as const) {
      const web = shapesFor(view);
      const native = data.shapes.filter((s) => s.view === view);
      expect(native.map((s) => s.key)).toEqual(web.map((s) => s.key));
      expect(native.map((s) => s.label)).toEqual(web.map((s) => s.label));
      for (let i = 0; i < web.length; i++) {
        expect(bbox(native[i].primitive)).toEqual(web[i].bbox);
      }
    }
  });
});
