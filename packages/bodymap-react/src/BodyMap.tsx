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

/** Extra SVG user-units of hit area around each region (viewBox is 200×400). */
const HIT_STROKE = 20;

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
        <g key={s.key} className="ht-region">
          {/* Invisible fat stroke so small joints (knees, hands) stay tappable. */}
          <path
            className="ht-hit"
            d={s.d}
            fill="transparent"
            stroke="transparent"
            strokeWidth={HIT_STROKE}
            strokeLinejoin="round"
            role="button"
            tabIndex={0}
            aria-label={s.label}
            aria-pressed={selectedKey === s.key}
            style={{ cursor: "pointer" }}
            onClick={(e) => select(s, e.nativeEvent.offsetX, e.nativeEvent.offsetY)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                select(s);
              }
            }}
          />
          <path
            className="ht-fill"
            d={s.d}
            fill={selectedKey === s.key ? "#2563eb" : (shading?.get(s.key) ?? "#cbd5e1")}
            stroke="#334155"
            strokeWidth={1}
            pointerEvents="none"
            aria-hidden="true"
          />
        </g>
      ))}
    </svg>
  );
};
