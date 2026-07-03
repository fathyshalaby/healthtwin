import * as React from "react";

/** Read-only 0–10 intensity on the cool→amber→heat spectrum. */
export function IntensityMeter({ value }: { value: number }) {
  const v = Math.max(0, Math.min(10, value));
  return (
    <span className="meter" role="img" aria-label={`Intensity ${v} of 10`}>
      <span className="meter-track">
        <span className="meter-fill" style={{ width: `${v * 10}%` }} />
      </span>
      <span className="meter-val">{v}<small>/10</small></span>
    </span>
  );
}
