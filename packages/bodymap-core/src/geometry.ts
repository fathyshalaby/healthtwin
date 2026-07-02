import type { RegionKey, Side, BodyView } from "@healthtwin/core";
import { regionKey } from "@healthtwin/core";

export interface BBox { x: number; y: number; w: number; h: number; }

export interface RegionShape {
  key: RegionKey;
  regionId: string;
  side: Side;
  view: BodyView;
  label: string;
  d: string;   // SVG path (placeholder rects; replace with licensed anatomy art later)
  bbox: BBox;
}

export const VIEWBOX = { w: 200, h: 400 };

const rect = (b: BBox): string =>
  `M${b.x} ${b.y} h${b.w} v${b.h} h${-b.w} Z`;

const shape = (
  regionId: string, side: Side, view: BodyView, label: string, bbox: BBox,
): RegionShape => ({ key: regionKey({ regionId, side, view }), regionId, side, view, label, d: rect(bbox), bbox });

// Starter placeholder layout on a 200x400 canvas.
const ANTERIOR: RegionShape[] = [
  shape("head", "central", "anterior", "Head", { x: 85, y: 10, w: 30, h: 40 }),
  shape("neck", "central", "anterior", "Neck", { x: 92, y: 50, w: 16, h: 15 }),
  shape("chest", "central", "anterior", "Chest", { x: 70, y: 70, w: 60, h: 45 }),
  shape("abdomen", "central", "anterior", "Abdomen", { x: 75, y: 120, w: 50, h: 45 }),
  shape("shoulder", "left", "anterior", "Left Shoulder", { x: 55, y: 68, w: 18, h: 18 }),
  shape("shoulder", "right", "anterior", "Right Shoulder", { x: 127, y: 68, w: 18, h: 18 }),
  shape("knee", "left", "anterior", "Left Knee", { x: 78, y: 280, w: 18, h: 22 }),
  shape("knee", "right", "anterior", "Right Knee", { x: 104, y: 280, w: 18, h: 22 }),
];

const POSTERIOR: RegionShape[] = [
  shape("head", "central", "posterior", "Head", { x: 85, y: 10, w: 30, h: 40 }),
  shape("neck", "central", "posterior", "Neck", { x: 92, y: 50, w: 16, h: 15 }),
  shape("lower_back", "central", "posterior", "Lower Back", { x: 78, y: 130, w: 44, h: 40 }),
  shape("shoulder", "left", "posterior", "Left Shoulder", { x: 55, y: 68, w: 18, h: 18 }),
  shape("shoulder", "right", "posterior", "Right Shoulder", { x: 127, y: 68, w: 18, h: 18 }),
];

export function shapesFor(view: BodyView): RegionShape[] {
  return view === "anterior" ? ANTERIOR : POSTERIOR;
}

export function normalizedPoint(bbox: BBox, px: number, py: number): { x: number; y: number } {
  const clamp = (n: number) => Math.min(1, Math.max(0, n));
  return { x: clamp((px - bbox.x) / bbox.w), y: clamp((py - bbox.y) / bbox.h) };
}
