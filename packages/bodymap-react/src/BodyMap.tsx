import * as React from "react";
import type { RegionKey, Side, BodyView } from "@healthtwin/core";
import { shapesFor, normalizedPoint, hitTestShapes, HIT_PAD, VIEWBOX, type RegionShape } from "@healthtwin/bodymap-core";

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

/**
 * Client (CSS px) → SVG user units. Uses the browser's own transform when it has one (exact, including the
 * letterboxing of `preserveAspectRatio`), else the default xMidYMid-meet maths. `null` when there's no layout.
 */
function toUserSpace(svg: SVGSVGElement, clientX: number, clientY: number): { x: number; y: number } | null {
  const ctm = typeof svg.getScreenCTM === "function" ? svg.getScreenCTM() : null;
  if (ctm) {
    const m = ctm.inverse();
    return { x: m.a * clientX + m.c * clientY + m.e, y: m.b * clientX + m.d * clientY + m.f };
  }
  const r = svg.getBoundingClientRect();
  const w = svg.clientWidth || r.width;
  const h = svg.clientHeight || r.height;
  if (!w || !h) return null;
  const scale = Math.min(w / VIEWBOX.w, h / VIEWBOX.h);
  const ox = r.left + (svg.clientLeft || 0) + (w - VIEWBOX.w * scale) / 2;
  const oy = r.top + (svg.clientTop || 0) + (h - VIEWBOX.h * scale) / 2;
  return { x: (clientX - ox) / scale, y: (clientY - oy) / scale };
}

const near = (s: RegionShape, p: { x: number; y: number } | null) =>
  p != null && Number.isFinite(p.x) && Number.isFinite(p.y) &&
  p.x >= s.bbox.x - HIT_PAD && p.x <= s.bbox.x + s.bbox.w + HIT_PAD &&
  p.y >= s.bbox.y - HIT_PAD && p.y <= s.bbox.y + s.bbox.h + HIT_PAD;

/**
 * Hit-testing follows `hitTest` in @healthtwin/bodymap-core (the same rule the Flutter, Swift, Kotlin and
 * React Native SDKs use): a tap *on* a region is that region (the topmost one where shapes overlap); a near
 * miss goes to the nearest region within HIT_PAD units, ties to the smaller one. Region paths are exact —
 * no fat invisible strokes — so a padded neighbour can never steal a tap that landed on a region.
 */
export const BodyMap: React.FC<BodyMapProps> = ({ view, selectedKey, shading, onSelect, onHover }) => {
  const shapes = shapesFor(view);
  const svgRef = React.useRef<SVGSVGElement>(null);
  const [hot, setHot] = React.useState<RegionKey | null>(null);
  // Unique per instance so two maps on one page (e.g. a report) never share a gradient id.
  const sheenId = `ht-sheen-${React.useId().replace(/[^a-zA-Z0-9]/g, "")}`;

  const userPoint = (e: { clientX: number; clientY: number }) =>
    svgRef.current ? toUserSpace(svgRef.current, e.clientX, e.clientY) : null;

  const select = (s: RegionShape, p: { x: number; y: number } | null) => {
    // Assistive tech can activate a region with no usable coordinates — then record its centre.
    const point = near(s, p) ? normalizedPoint(s.bbox, p!.x, p!.y) : { x: 0.5, y: 0.5 };
    onSelect({ key: s.key, regionId: s.regionId, side: s.side, view: s.view, point });
  };

  const setHover = (s: RegionShape | null) => {
    const next = s?.key ?? null;
    if (next === hot) return;
    setHot(next);
    onHover?.(s ? { key: s.key, regionId: s.regionId, side: s.side, view: s.view, label: s.label } : null);
  };

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${VIEWBOX.w} ${VIEWBOX.h}`}
      role="group"
      aria-label={`Body map, ${view} view`}
      width="100%"
      style={hot ? { cursor: "pointer" } : undefined}
      onPointerMove={(e) => {
        const p = userPoint(e);
        setHover(p ? hitTestShapes(shapes, p.x, p.y) : null);
      }}
      onPointerLeave={() => setHover(null)}
    >
      <defs>
        {/* Soft top-light → bottom-shade so flat shapes read as volumes. Purely decorative. */}
        <linearGradient id={sheenId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.5" />
          <stop offset="0.45" stopColor="#ffffff" stopOpacity="0.06" />
          <stop offset="1" stopColor="#0b1622" stopOpacity="0.14" />
        </linearGradient>
      </defs>
      {/* Near-miss catcher, beneath every region: a tap that lands on no shape goes to the nearest one. */}
      <rect
        className="ht-catch"
        x={0}
        y={0}
        width={VIEWBOX.w}
        height={VIEWBOX.h}
        fill="transparent"
        aria-hidden="true"
        onClick={(e) => {
          const p = userPoint(e);
          const s = p ? hitTestShapes(shapes, p.x, p.y) : null;
          if (s) select(s, p);
        }}
      />
      {shapes.map((s) => {
        const selected = selectedKey === s.key;
        const shaded = shading?.get(s.key);
        return (
          <g key={s.key} className="ht-region" data-hot={hot === s.key ? "" : undefined}>
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
            {/* The exact region: the accessible control, and the hit target for a tap on the region itself. */}
            <path
              className="ht-hit"
              d={s.d}
              fill="transparent"
              role="button"
              tabIndex={0}
              aria-label={s.label}
              aria-pressed={selected}
              style={{ cursor: "pointer" }}
              onClick={(e) => select(s, userPoint(e))}
              onFocus={() => setHover(s)}
              onBlur={() => setHover(null)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  select(s, null);
                }
              }}
            />
          </g>
        );
      })}
    </svg>
  );
};
