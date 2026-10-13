import { getRegion, type Side } from "@healthtwin/core";

/** "Left Knee", "Lower Back" — a region's label with its side, so left and right are never ambiguous. */
export function regionTitle(regionId: string, side: Side): string {
  const base = getRegion(regionId)?.label ?? regionId;
  return side === "central" ? base : `${side === "left" ? "Left" : "Right"} ${base}`;
}
