import type { RegionKey } from "@healthtwin/core";

/** Scale a set of per-region metric values into [0,1]. Equal values all map to 1. */
export function normalize(values: Map<RegionKey, number>): Map<RegionKey, number> {
  const vals = [...values.values()];
  const out = new Map<RegionKey, number>();
  if (vals.length === 0) return out;
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  for (const [k, v] of values) out.set(k, max === min ? 1 : (v - min) / (max - min));
  return out;
}

/** Map t∈[0,1] to a blue→red heat color. */
export function heatColor(t: number): string {
  const clamped = Math.min(1, Math.max(0, t));
  const hue = 210 - clamped * 210; // 210 (cool blue) → 0 (hot red)
  return `hsl(${Math.round(hue)}, 85%, 55%)`;
}

/** Turn per-region metric values into per-region fill colors. */
export function shadingFor(values: Map<RegionKey, number>): Map<RegionKey, string> {
  const out = new Map<RegionKey, string>();
  for (const [k, t] of normalize(values)) out.set(k, heatColor(t));
  return out;
}
