import * as React from "react";
import type { RegionKey, Side, BodyView } from "@healthtwin/core";
import { shapesFor, normalizedPoint, VIEWBOX, type RegionShape } from "@healthtwin/bodymap-core";

export interface BodyMapSelection {
  key: RegionKey;
  regionId: string;
  side: Side;
  view: BodyView;
  point: { x: number; y: number };
}

export interface BodyMapProps {
  view: BodyView;
  selectedKey?: RegionKey;
  /** Review mode: per-region fill colors (e.g. a heatmap). */
  shading?: Map<RegionKey, string>;
  onSelect: (sel: BodyMapSelection) => void;
}

export const BodyMap: React.FC<BodyMapProps> = ({ view, selectedKey, shading, onSelect }) => {
  const shapes = shapesFor(view);

  const select = (s: RegionShape, clientX?: number, clientY?: number) => {
    const point =
      clientX != null && clientY != null
        ? normalizedPoint(s.bbox, clientX, clientY)
        : { x: 0.5, y: 0.5 };
    onSelect({ key: s.key, regionId: s.regionId, side: s.side, view: s.view, point });
  };

  return (
    <svg
      viewBox={`0 0 ${VIEWBOX.w} ${VIEWBOX.h}`}
      role="group"
      aria-label={`Body map, ${view} view`}
      width="100%"
    >
      {shapes.map((s) => (
        <path
          key={s.key}
          d={s.d}
          role="button"
          tabIndex={0}
          aria-label={s.label}
          aria-pressed={selectedKey === s.key}
          fill={selectedKey === s.key ? "#2563eb" : (shading?.get(s.key) ?? "#cbd5e1")}
          stroke="#334155"
          strokeWidth={1}
          style={{ cursor: "pointer" }}
          onClick={(e) => select(s, e.nativeEvent.offsetX, e.nativeEvent.offsetY)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              select(s);
            }
          }}
        />
      ))}
    </svg>
  );
};
