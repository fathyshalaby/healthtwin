import { describe, it, expect } from "vitest";
import { shapesFor, type RegionShape } from "./geometry";
import { HIT_PAD, distanceOutside, hitTest, hitTestShapes, primitiveArea } from "./hittest";

const label = (x: number, y: number, view: "anterior" | "posterior" = "anterior") => hitTest(x, y, view)?.label ?? null;
const byKey = (key: string, view: "anterior" | "posterior" = "anterior") => shapesFor(view).find((s) => s.key === key)!;
const ellipse = (s: RegionShape) => {
  if (s.primitive.kind !== "ellipse") throw new Error(`${s.key} is not an ellipse`);
  return s.primitive;
};

// Points are derived from the geometry, and each regression test first asserts the condition that made the
// old "topmost shape within the pad" rule fail — so the tests stay meaningful if the figure is redrawn.
describe("hitTest — exact first", () => {
  it("every region's own centre resolves to that region (both views)", () => {
    for (const view of ["anterior", "posterior"] as const) {
      for (const s of shapesFor(view)) {
        const cx = s.bbox.x + s.bbox.w / 2;
        const cy = s.bbox.y + s.bbox.h / 2;
        expect(hitTest(cx, cy, view)?.key, `${view} ${s.label}`).toBe(s.key);
      }
    }
  });

  it("a tap inside the LEFT knee is the left knee, not the right one (regression)", () => {
    const left = ellipse(byKey("knee:left:anterior"));
    const right = byKey("knee:right:anterior");
    const x = left.cx + left.rx - 3; // inside the left knee, on its inner side
    expect(distanceOutside(left, x, left.cy)).toBe(0);
    expect(distanceOutside(right.primitive, x, left.cy)).toBeLessThanOrEqual(HIT_PAD); // …within the right knee's pad
    expect(label(x, left.cy)).toBe("Left Knee");
    expect(label(200 - x, left.cy)).toBe("Right Knee");
  });

  it("the centre of a shoulder is the shoulder, not the chest beside it (regression)", () => {
    for (const view of ["anterior", "posterior"] as const) {
      const shoulder = ellipse(byKey(`shoulder:right:${view}`, view));
      const torso = byKey(view === "anterior" ? "chest:central:anterior" : "upper_back:central:posterior", view);
      expect(distanceOutside(torso.primitive, shoulder.cx, shoulder.cy)).toBeLessThanOrEqual(HIT_PAD);
      expect(label(shoulder.cx, shoulder.cy, view)).toBe("Right Shoulder");
      expect(label(200 - shoulder.cx, shoulder.cy, view)).toBe("Left Shoulder");
    }
  });

  it("where shapes visibly overlap, the one painted on top wins (what the person sees)", () => {
    const shoulder = ellipse(byKey("shoulder:left:anterior"));
    const x = shoulder.cx + shoulder.rx - 4; // inside the shoulder cap AND inside the chest, painted later
    expect(distanceOutside(shoulder, x, shoulder.cy)).toBe(0);
    expect(distanceOutside(byKey("chest:central:anterior").primitive, x, shoulder.cy)).toBe(0);
    expect(label(x, shoulder.cy)).toBe("Chest");
  });
});

describe("hitTest — near misses", () => {
  it("just off a hand still means the hand (nearest within the pad)", () => {
    const hand = ellipse(byKey("hand:left:anterior"));
    const edge = hand.cx - hand.rx;
    expect(label(edge - 3, hand.cy)).toBe("Left Hand");
    // exactly at the pad boundary still counts; just beyond it does not
    expect(label(edge - HIT_PAD, hand.cy)).toBe("Left Hand");
    expect(label(edge - HIT_PAD - 0.5, hand.cy)).toBeNull();
  });

  it("outside the pad is nothing", () => {
    expect(label(5, 5)).toBeNull();
    expect(label(100, 395)).toBeNull();
  });

  it("when two shapes are equally near, the smaller wins", () => {
    // Two shapes 10 units apart with a gap point exactly 5 from each: a small joint and a long limb.
    const joint: RegionShape = { ...byKey("knee:left:anterior"), key: "joint", label: "Joint", primitive: { kind: "ellipse", cx: 0, cy: 0, rx: 5, ry: 5 } };
    const limb: RegionShape = { ...byKey("thigh:left:anterior"), key: "limb", label: "Limb", primitive: { kind: "rr", x: -10, y: 10, w: 20, h: 60, r: 4 } };
    expect(hitTestShapes([joint, limb], 0, 7.5)?.key).toBe("joint"); // 2.5 from each
    expect(hitTestShapes([limb, joint], 0, 7.5)?.key).toBe("joint"); // order doesn't matter for a tie
    expect(hitTestShapes([joint, limb], 0, 9)?.key).toBe("limb"); // nearer wins over smaller
  });
});

describe("distanceOutside / primitiveArea", () => {
  it("is 0 inside and measures rounded-rect corners exactly", () => {
    const p = { kind: "rr", x: 0, y: 0, w: 20, h: 20, r: 5 } as const;
    expect(distanceOutside(p, 10, 10)).toBe(0);
    expect(distanceOutside(p, 25, 10)).toBe(5); // straight out from an edge
    // the corner (0,0) lies outside the rounded corner by r·(√2 − 1)
    expect(distanceOutside(p, 0, 0)).toBeCloseTo(5 * (Math.SQRT2 - 1), 6);
  });

  it("is exact for circles", () => {
    const c = { kind: "ellipse", cx: 0, cy: 0, rx: 10, ry: 10 } as const;
    expect(distanceOutside(c, 0, 0)).toBe(0);
    expect(distanceOutside(c, 13, 0)).toBeCloseTo(3, 9);
  });

  it("orders a knee below a shin by area", () => {
    expect(primitiveArea(byKey("knee:left:anterior").primitive)).toBeLessThan(primitiveArea(byKey("shin:left:anterior").primitive));
  });
});

describe("the figure", () => {
  it("is mirror-symmetric: every left region mirrors its right twin", () => {
    for (const view of ["anterior", "posterior"] as const) {
      for (const s of shapesFor(view).filter((r) => r.side === "left")) {
        const twin = byKey(s.key.replace(":left:", ":right:"), view);
        expect(twin.bbox.x + twin.bbox.w, s.key).toBeCloseTo(200 - s.bbox.x, 9);
        expect([twin.bbox.y, twin.bbox.w, twin.bbox.h]).toEqual([s.bbox.y, s.bbox.w, s.bbox.h]);
      }
    }
  });

  it("is one connected silhouette: every region touches or overlaps another", () => {
    for (const view of ["anterior", "posterior"] as const) {
      const shapes = shapesFor(view);
      for (const s of shapes) {
        const touches = shapes.some((o) => o !== s &&
          o.bbox.x <= s.bbox.x + s.bbox.w && s.bbox.x <= o.bbox.x + o.bbox.w &&
          o.bbox.y <= s.bbox.y + s.bbox.h && s.bbox.y <= o.bbox.y + o.bbox.h);
        expect(touches, `${view} ${s.label}`).toBe(true);
      }
    }
  });
});
