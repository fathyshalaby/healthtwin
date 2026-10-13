"use client";
import * as React from "react";

/** A card whose hover highlight follows the cursor (sets --mx/--my; the CSS draws the glow). */
export function Spot({ className, children }: { className?: string; children: React.ReactNode }) {
  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
  };
  return <div className={className} onPointerMove={onMove}>{children}</div>;
}
