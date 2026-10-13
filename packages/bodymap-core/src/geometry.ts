import type { RegionKey, Side, BodyView } from "@healthtwin/core";
import { regionKey } from "@healthtwin/core";

export interface BBox { x: number; y: number; w: number; h: number; }

/** The geometric primitive a region is drawn from — the same data packages/mobile/shapes.json carries. */
export type Primitive =
  | { kind: "ellipse"; cx: number; cy: number; rx: number; ry: number }
  | { kind: "rr"; x: number; y: number; w: number; h: number; r: number };

export interface RegionShape {
  key: RegionKey;
  regionId: string;
  side: Side;
  view: BodyView;
  label: string;
  d: string; // SVG path
  bbox: BBox;
  primitive: Primitive;
}

export const VIEWBOX = { w: 200, h: 400 };

type Geom = { d: string; bbox: BBox; primitive: Primitive };

// Rounded-rectangle path (for limbs and torso segments).
function rr(x: number, y: number, w: number, h: number, r: number): Geom {
  const k = Math.min(r, w / 2, h / 2);
  const d =
    `M${x + k},${y} h${w - 2 * k} a${k},${k} 0 0 1 ${k},${k} v${h - 2 * k} ` +
    `a${k},${k} 0 0 1 ${-k},${k} h${-(w - 2 * k)} a${k},${k} 0 0 1 ${-k},${-k} ` +
    `v${-(h - 2 * k)} a${k},${k} 0 0 1 ${k},${-k} z`;
  return { d, bbox: { x, y, w, h }, primitive: { kind: "rr", x, y, w, h, r } };
}

// Ellipse path (for head, joints, hands, feet).
function ell(cx: number, cy: number, rx: number, ry: number): Geom {
  const d = `M${cx - rx},${cy} a${rx},${ry} 0 1 0 ${2 * rx},0 a${rx},${ry} 0 1 0 ${-2 * rx},0 z`;
  return { d, bbox: { x: cx - rx, y: cy - ry, w: 2 * rx, h: 2 * ry }, primitive: { kind: "ellipse", cx, cy, rx, ry } };
}

const shape = (regionId: string, side: Side, view: BodyView, label: string, g: Geom): RegionShape => ({
  key: regionKey({ regionId, side, view }),
  regionId, side, view, label, d: g.d, bbox: g.bbox, primitive: g.primitive,
});

// An original, deliberately simple figure on a 200×400 canvas, drawn like a pictogram: round head, a straight
// torso, and limbs that are even capsules — about 7.5 heads tall, mirror-symmetric, one continuous outline.
// Where two segments meet end to end they share a width and overlap by exactly the sum of their corner radii,
// so the join is seamless (no notch at the waist, elbow or wrist) and a near miss along the side still goes to
// the segment you can see there. Shoulders, knees, hands and feet are ellipses that round off a corner or a joint.
// Every region's centre lies on its own visible area (hittest.test.ts checks this).
// "left" is the viewer's left in both views — the front view is a mirror of the person; the UI marks L / R.
const ANTERIOR: RegionShape[] = [
  shape("head", "central", "anterior", "Head", ell(100, 39, 17.5, 22.5)),
  shape("neck", "central", "anterior", "Neck", rr(92, 60, 16, 26, 4)),
  shape("shoulder", "left", "anterior", "Left Shoulder", ell(68, 96, 17.5, 15)),
  shape("shoulder", "right", "anterior", "Right Shoulder", ell(132, 96, 17.5, 15)),
  shape("chest", "central", "anterior", "Chest", rr(73, 79, 54, 53, 6)),
  shape("abdomen", "central", "anterior", "Abdomen", rr(73, 122, 54, 58, 4)),
  shape("pelvis", "central", "anterior", "Pelvis", rr(73, 160, 54, 38, 16)),
  shape("upper_arm", "left", "anterior", "Left Upper Arm", rr(50.5, 88.5, 15, 71.5, 7.5)),
  shape("upper_arm", "right", "anterior", "Right Upper Arm", rr(134.5, 88.5, 15, 71.5, 7.5)),
  shape("forearm", "left", "anterior", "Left Forearm", rr(50.5, 145, 15, 67.5, 7.5)),
  shape("forearm", "right", "anterior", "Right Forearm", rr(134.5, 145, 15, 67.5, 7.5)),
  shape("hand", "left", "anterior", "Left Hand", ell(58, 205, 8, 12.5)),
  shape("hand", "right", "anterior", "Right Hand", ell(142, 205, 8, 12.5)),
  shape("thigh", "left", "anterior", "Left Thigh", rr(77, 180, 22, 98, 11)),
  shape("thigh", "right", "anterior", "Right Thigh", rr(101, 180, 22, 98, 11)),
  shape("knee", "left", "anterior", "Left Knee", ell(88, 267, 11, 14)),
  shape("knee", "right", "anterior", "Right Knee", ell(112, 267, 11, 14)),
  shape("shin", "left", "anterior", "Left Shin", rr(80, 272, 16, 84, 4.5)),
  shape("shin", "right", "anterior", "Right Shin", rr(104, 272, 16, 84, 4.5)),
  shape("foot", "left", "anterior", "Left Foot", ell(88, 352, 10, 9)),
  shape("foot", "right", "anterior", "Right Foot", ell(112, 352, 10, 9)),
];

// Same silhouette from behind; there is no knee region, so the calf tucks into the thigh's rounded end.
const POSTERIOR: RegionShape[] = [
  shape("head", "central", "posterior", "Head", ell(100, 39, 17.5, 22.5)),
  shape("neck", "central", "posterior", "Neck", rr(92, 60, 16, 26, 4)),
  shape("shoulder", "left", "posterior", "Left Shoulder", ell(68, 96, 17.5, 15)),
  shape("shoulder", "right", "posterior", "Right Shoulder", ell(132, 96, 17.5, 15)),
  shape("upper_back", "central", "posterior", "Upper Back", rr(73, 79, 54, 53, 6)),
  shape("lower_back", "central", "posterior", "Lower Back", rr(73, 122, 54, 58, 4)),
  shape("glutes", "central", "posterior", "Glutes", rr(73, 160, 54, 38, 16)),
  shape("upper_arm", "left", "posterior", "Left Upper Arm", rr(50.5, 88.5, 15, 71.5, 7.5)),
  shape("upper_arm", "right", "posterior", "Right Upper Arm", rr(134.5, 88.5, 15, 71.5, 7.5)),
  shape("forearm", "left", "posterior", "Left Forearm", rr(50.5, 145, 15, 67.5, 7.5)),
  shape("forearm", "right", "posterior", "Right Forearm", rr(134.5, 145, 15, 67.5, 7.5)),
  shape("hand", "left", "posterior", "Left Hand", ell(58, 205, 8, 12.5)),
  shape("hand", "right", "posterior", "Right Hand", ell(142, 205, 8, 12.5)),
  shape("thigh", "left", "posterior", "Left Thigh", rr(77, 180, 22, 98, 11)),
  shape("thigh", "right", "posterior", "Right Thigh", rr(101, 180, 22, 98, 11)),
  shape("calf", "left", "posterior", "Left Calf", rr(80, 266.5, 16, 89.5, 8)),
  shape("calf", "right", "posterior", "Right Calf", rr(104, 266.5, 16, 89.5, 8)),
  shape("foot", "left", "posterior", "Left Foot", ell(88, 352, 10, 9)),
  shape("foot", "right", "posterior", "Right Foot", ell(112, 352, 10, 9)),
];

export function shapesFor(view: BodyView): RegionShape[] {
  return view === "anterior" ? ANTERIOR : POSTERIOR;
}

export function normalizedPoint(bbox: BBox, px: number, py: number): { x: number; y: number } {
  const clamp = (n: number) => Math.min(1, Math.max(0, n));
  return { x: clamp((px - bbox.x) / bbox.w), y: clamp((py - bbox.y) / bbox.h) };
}
