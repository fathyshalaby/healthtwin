// Shared design tokens — the same clinical-instrument palette as the web app.
export const T = {
  ink: "#0b1622",
  ink2: "#16283b",
  canvas: "#e9eff4",
  paper: "#ffffff",
  line: "#d7e0e8",
  lineSoft: "#e6edf2",
  muted: "#5c6b7a",
  cool: "#2563eb",
  heat: "#ff5a3c",
  amber: "#f59e0b",
  mint: "#10b981",
} as const;

/** 0–10 intensity → a point on the cool→mint→amber→heat spectrum. */
export function intensityColor(v: number): string {
  if (v <= 2) return T.cool;
  if (v <= 4) return T.mint;
  if (v <= 6) return T.amber;
  if (v <= 8) return "#fb7c4d";
  return T.heat;
}

export const radius = 14;
