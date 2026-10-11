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

/** The region under the pointer / keyboard focus (no click point — it's a hover, not a selection). */
export interface BodyMapHover {
  key: RegionKey;
  regionId: string;
  side: Side;
  view: BodyView;
  label: string;
}

export interface BodyMapProps {
  view: BodyView;
  selectedKey?: RegionKey;
  /** Review mode: per-region fill colors (e.g. a heatmap). */
  shading?: Map<RegionKey, string>;
  onSelect: (sel: BodyMapSelection) => void;
  /** Fires with the region under the pointer or keyboard focus, and `null` when it leaves. */
  onHover?: (hover: BodyMapHover | null) => void;
}

/** Extra SVG user-units of hit area around each region (viewBox is 200×400). */
const HIT_STROKE = 20;

export const BodyMap: React.FC<BodyMapProps> = ({ view, selectedKey, shading, onSelect, onHover }) => {
  const shapes = shapesFor(view);
  // Unique per instance so two maps on one page (e.g. a report) never share a gradient id.
  const sheenId = `ht-sheen-${React.useId().replace(/[^a-zA-Z0-9]/g, "")}`;

  const select = (s: RegionShape, clientX?: number, clientY?: number) => {
    const point =
      clientX != null && clientY != null
        ? normalizedPoint(s.bbox, clientX, clientY)
        : { x: 0.5, y: 0.5 };
    onSelect({ key: s.key, regionId: s.regionId, side: s.side, view: s.view, point });
  };

  const hover = (s: RegionShape | null) =>
    onHover?.(s ? { key: s.key, regionId: s.regionId, side: s.side, view: s.view, label: s.label } : null);

  return (
    <svg
      viewBox={`0 0 ${VIEWBOX.w} ${VIEWBOX.h}`}
      role="group"
      aria-label={`Body map, ${view} view`}
      width="100%"
    >
      <defs>
        {/* Soft top-light → bottom-shade so flat shapes read as volumes. Purely decorative. */}
        <linearGradient id={sheenId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.5" />
          <stop offset="0.45" stopColor="#ffffff" stopOpacity="0.06" />
          <stop offset="1" stopColor="#0b1622" stopOpacity="0.14" />
        </linearGradient>
      </defs>
      {shapes.map((s) => {
        const selected = selectedKey === s.key;
        const shaded = shading?.get(s.key);
        return (
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
              aria-pressed={selected}
              style={{ cursor: "pointer" }}
              onClick={(e) => select(s, e.nativeEvent.offsetX, e.nativeEvent.offsetY)}
              onPointerEnter={() => hover(s)}
              onPointerLeave={() => hover(null)}
              onFocus={() => hover(s)}
              onBlur={() => hover(null)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  select(s);
                }
              }}
            />
            {/* The attribute fill is the headless default; hosts may restyle un-shaded regions via
                CSS using the data hooks (a shaded/selected region keeps its own colour). */}
            <path
              className="ht-fill"
              d={s.d}
              fill={selected ? "#2563eb" : (shaded ?? "#cbd5e1")}
              stroke="#334155"
              strokeWidth={1}
              data-selected={selected ? "" : undefined}
              data-shaded={shaded ? "" : undefined}
              pointerEvents="none"
              aria-hidden="true"
            />
            <path className="ht-sheen" d={s.d} fill={`url(#${sheenId})`} pointerEvents="none" aria-hidden="true" />
          </g>
        );
      })}
    </svg>
  );
};
