import { heatColor } from "@healthtwin/bodymap-core";

// Shared design tokens — the same "thermal instrument" palette as the web app (apps/web/app/globals.css).
export const T = {
  ink: "#0b1420",
  ink2: "#14233a",
  canvas: "#f5f7fb",
  paper: "#ffffff",
  line: "#dde5ee",
  lineSoft: "#e9eef4",
  muted: "#55687d",
  cool: "#2f6df0",
  heat: "#f4513a",
  amber: "#f59e0b",
  mint: "#12b981",
  // body figure
  bodyFill: "#dfe6ef",
  bodyStroke: "#7f90a8",
} as const;

/**
 * 0–10 intensity → the shared cool→hot heat scale. Uses the same `heatColor` as the web body map, slider,
 * meters and timeline, so a 7/10 is the same colour on every platform.
 */
export function intensityColor(v: number): string {
  return heatColor(Math.max(0, Math.min(10, v)) / 10);
}

export const radius = 14;
