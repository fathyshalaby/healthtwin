import type { BodyView } from "@healthtwin/core";
import { shapesFor, type Primitive, type RegionShape } from "./geometry";

/**
 * How far outside a shape (in viewBox units) a tap still counts — the same 10 units every SDK uses
 * (packages/mobile/shapes.json `hitPad`). Small joints stay tappable without a pixel-perfect finger.
 */
export const HIT_PAD = 10;

/**
 * Distance from (px, py) to the outside of a primitive, in viewBox units; 0 when the point is inside.
 * Rounded rects are exact (corners included). Ellipses use the radial approximation, exact for circles
 * and within a fraction of a unit for these near-circular joints.
 */
export function distanceOutside(p: Primitive, px: number, py: number): number {
  if (p.kind === "ellipse") {
    const f = Math.hypot((px - p.cx) / p.rx, (py - p.cy) / p.ry);
    if (f <= 1) return 0;
    return Math.hypot(px - p.cx, py - p.cy) * (1 - 1 / f);
  }
  const k = Math.min(p.r, p.w / 2, p.h / 2);
  const dx = Math.max(Math.abs(px - (p.x + p.w / 2)) - (p.w / 2 - k), 0);
  const dy = Math.max(Math.abs(py - (p.y + p.h / 2)) - (p.h / 2 - k), 0);
  return Math.max(Math.hypot(dx, dy) - k, 0);
}

/** Area in square viewBox units (tie-breaker: when two shapes are equally near, the smaller one wins). */
export function primitiveArea(p: Primitive): number {
  if (p.kind === "ellipse") return Math.PI * p.rx * p.ry;
  const k = Math.min(p.r, p.w / 2, p.h / 2);
  return p.w * p.h - (4 - Math.PI) * k * k;
}

/**
 * Which region a tap at (x, y) — viewBox units — means. The single source of truth every platform follows:
 *
 * 1. **Exact first.** If the point is inside a shape, return the topmost one (last painted) — i.e. what the
 *    person visibly tapped. Padding never lets a neighbour steal a tap that landed on a region.
 * 2. **Near-miss.** Otherwise return the nearest shape within `pad`; on a tie, the smaller shape, so a tap
 *    just off a knee means the knee rather than the thigh beside it.
 *
 * Returns `null` when nothing is within `pad`.
 */
export function hitTest(x: number, y: number, view: BodyView, pad: number = HIT_PAD): RegionShape | null {
  return hitTestShapes(shapesFor(view), x, y, pad);
}

/** {@link hitTest} over an explicit, paint-ordered list of shapes. */
export function hitTestShapes(shapes: readonly RegionShape[], x: number, y: number, pad: number = HIT_PAD): RegionShape | null {
  for (let i = shapes.length - 1; i >= 0; i--) {
    if (distanceOutside(shapes[i].primitive, x, y) === 0) return shapes[i];
  }
  let best: RegionShape | null = null;
  let bestD = Infinity;
  let bestA = Infinity;
  for (const s of shapes) {
    const d = distanceOutside(s.primitive, x, y);
    if (d > pad) continue;
    const a = primitiveArea(s.primitive);
    const nearer = d < bestD - 1e-9;
    const tieButSmaller = Math.abs(d - bestD) <= 1e-9 && a < bestA;
    if (nearer || tieButSmaller) { best = s; bestD = d; bestA = a; }
  }
  return best;
}
