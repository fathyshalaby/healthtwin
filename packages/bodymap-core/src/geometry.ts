import type { RegionKey, Side, BodyView } from "@healthtwin/core";
import { regionKey } from "@healthtwin/core";

export interface BBox { x: number; y: number; w: number; h: number; }

export interface RegionShape {
  key: RegionKey;
  regionId: string;
  side: Side;
  view: BodyView;
  label: string;
  d: string; // SVG path
  bbox: BBox;
}

export const VIEWBOX = { w: 200, h: 400 };

type Geom = { d: string; bbox: BBox };

// Rounded-rectangle path (for limbs and torso segments).
function rr(x: number, y: number, w: number, h: number, r: number): Geom {
  const k = Math.min(r, w / 2, h / 2);
  const d =
    `M${x + k},${y} h${w - 2 * k} a${k},${k} 0 0 1 ${k},${k} v${h - 2 * k} ` +
    `a${k},${k} 0 0 1 ${-k},${k} h${-(w - 2 * k)} a${k},${k} 0 0 1 ${-k},${-k} ` +
    `v${-(h - 2 * k)} a${k},${k} 0 0 1 ${k},${-k} z`;
  return { d, bbox: { x, y, w, h } };
}

// Ellipse path (for head, joints, hands, feet).
function ell(cx: number, cy: number, rx: number, ry: number): Geom {
  const d = `M${cx - rx},${cy} a${rx},${ry} 0 1 0 ${2 * rx},0 a${rx},${ry} 0 1 0 ${-2 * rx},0 z`;
  return { d, bbox: { x: cx - rx, y: cy - ry, w: 2 * rx, h: 2 * ry } };
}

const shape = (regionId: string, side: Side, view: BodyView, label: string, g: Geom): RegionShape => ({
  key: regionKey({ regionId, side, view }),
  regionId, side, view, label, d: g.d, bbox: g.bbox,
});

// A stylized humanoid on a 200×400 canvas. "left" is the viewer's left.
const ANTERIOR: RegionShape[] = [
  shape("head", "central", "anterior", "Head", ell(100, 34, 20, 26)),
  shape("neck", "central", "anterior", "Neck", rr(90, 56, 20, 15, 5)),
  shape("shoulder", "left", "anterior", "Left Shoulder", ell(66, 82, 17, 13)),
  shape("shoulder", "right", "anterior", "Right Shoulder", ell(134, 82, 17, 13)),
  shape("chest", "central", "anterior", "Chest", rr(70, 76, 60, 46, 12)),
  shape("abdomen", "central", "anterior", "Abdomen", rr(74, 124, 52, 40, 10)),
  shape("pelvis", "central", "anterior", "Pelvis", rr(74, 166, 52, 30, 12)),
  shape("upper_arm", "left", "anterior", "Left Upper Arm", rr(46, 90, 16, 52, 8)),
  shape("upper_arm", "right", "anterior", "Right Upper Arm", rr(138, 90, 16, 52, 8)),
  shape("forearm", "left", "anterior", "Left Forearm", rr(43, 146, 14, 50, 7)),
  shape("forearm", "right", "anterior", "Right Forearm", rr(143, 146, 14, 50, 7)),
  shape("hand", "left", "anterior", "Left Hand", ell(50, 204, 10, 13)),
  shape("hand", "right", "anterior", "Right Hand", ell(150, 204, 10, 13)),
  shape("thigh", "left", "anterior", "Left Thigh", rr(76, 198, 21, 66, 11)),
  shape("thigh", "right", "anterior", "Right Thigh", rr(103, 198, 21, 66, 11)),
  shape("knee", "left", "anterior", "Left Knee", ell(87, 272, 12, 13)),
  shape("knee", "right", "anterior", "Right Knee", ell(113, 272, 12, 13)),
  shape("shin", "left", "anterior", "Left Shin", rr(79, 288, 16, 64, 8)),
  shape("shin", "right", "anterior", "Right Shin", rr(105, 288, 16, 64, 8)),
  shape("foot", "left", "anterior", "Left Foot", ell(87, 364, 11, 15)),
  shape("foot", "right", "anterior", "Right Foot", ell(113, 364, 11, 15)),
];

const POSTERIOR: RegionShape[] = [
  shape("head", "central", "posterior", "Head", ell(100, 34, 20, 26)),
  shape("neck", "central", "posterior", "Neck", rr(90, 56, 20, 15, 5)),
  shape("shoulder", "left", "posterior", "Left Shoulder", ell(66, 82, 17, 13)),
  shape("shoulder", "right", "posterior", "Right Shoulder", ell(134, 82, 17, 13)),
  shape("upper_back", "central", "posterior", "Upper Back", rr(70, 76, 60, 46, 12)),
  shape("lower_back", "central", "posterior", "Lower Back", rr(74, 124, 52, 40, 10)),
  shape("glutes", "central", "posterior", "Glutes", rr(74, 166, 52, 30, 12)),
  shape("upper_arm", "left", "posterior", "Left Upper Arm", rr(46, 90, 16, 52, 8)),
  shape("upper_arm", "right", "posterior", "Right Upper Arm", rr(138, 90, 16, 52, 8)),
  shape("forearm", "left", "posterior", "Left Forearm", rr(43, 146, 14, 50, 7)),
  shape("forearm", "right", "posterior", "Right Forearm", rr(143, 146, 14, 50, 7)),
  shape("hand", "left", "posterior", "Left Hand", ell(50, 204, 10, 13)),
  shape("hand", "right", "posterior", "Right Hand", ell(150, 204, 10, 13)),
  shape("thigh", "left", "posterior", "Left Thigh", rr(76, 198, 21, 66, 11)),
  shape("thigh", "right", "posterior", "Right Thigh", rr(103, 198, 21, 66, 11)),
  shape("calf", "left", "posterior", "Left Calf", rr(79, 286, 16, 66, 8)),
  shape("calf", "right", "posterior", "Right Calf", rr(105, 286, 16, 66, 8)),
  shape("foot", "left", "posterior", "Left Foot", ell(87, 364, 11, 15)),
  shape("foot", "right", "posterior", "Right Foot", ell(113, 364, 11, 15)),
];

export function shapesFor(view: BodyView): RegionShape[] {
  return view === "anterior" ? ANTERIOR : POSTERIOR;
}

export function normalizedPoint(bbox: BBox, px: number, py: number): { x: number; y: number } {
  const clamp = (n: number) => Math.min(1, Math.max(0, n));
  return { x: clamp((px - bbox.x) / bbox.w), y: clamp((py - bbox.y) / bbox.h) };
}
