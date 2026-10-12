import { describe, it, expect } from "vitest";
import { shapesFor } from "./geometry";
import { HIT_PAD, distanceOutside, hitTest, primitiveArea } from "./hittest";

const label = (x: number, y: number, view: "anterior" | "posterior" = "anterior") => hitTest(x, y, view)?.label ?? null;

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
    // 8 units right of the left knee's centre — inside it, but within the right knee's padded zone.
    expect(label(95, 272)).toBe("Left Knee");
    expect(label(105, 272)).toBe("Right Knee");
  });

  it("the centre of a shoulder is the shoulder, not the chest or upper arm (regression)", () => {
    expect(label(134, 82)).toBe("Right Shoulder");
    expect(label(66, 82)).toBe("Left Shoulder");
    expect(label(134, 82, "posterior")).toBe("Right Shoulder");
  });

  it("where shapes visibly overlap, the one painted on top wins (what the person sees)", () => {
    // x=125 is inside both the right shoulder ellipse and the chest, which is painted later.
    expect(label(125, 82)).toBe("Chest");
  });
});

describe("hitTest — near misses", () => {
  it("in the gap between knee and shin, the smaller knee wins the tie", () => {
    // knee bottom edge y=285, shin top edge y=288: both 1.5 units away.
    expect(label(87, 286.5)).toBe("Left Knee");
  });

  it("just off a hand still means the hand (nearest within the pad)", () => {
    expect(label(37, 204)).toBe("Left Hand"); // 3 units left of the hand
  });

  it("outside the pad is nothing", () => {
    expect(label(5, 5)).toBeNull();
    expect(label(100, 395)).toBeNull();
    // exactly at the pad boundary still counts; just beyond it does not
    expect(label(40 - HIT_PAD, 204)).toBe("Left Hand");
    expect(label(40 - HIT_PAD - 0.5, 204)).toBeNull();
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
    const knee = shapesFor("anterior").find((s) => s.key === "knee:left:anterior")!;
    const shin = shapesFor("anterior").find((s) => s.key === "shin:left:anterior")!;
    expect(primitiveArea(knee.primitive)).toBeLessThan(primitiveArea(shin.primitive));
  });
});
