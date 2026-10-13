import * as React from "react";
import type { Observation } from "@healthtwin/core";
import { correlateSymptomWithMetric, type Sample, type SampleKind } from "@healthtwin/vitals";

// Hosts can re-skin the chart with --ht-sym / --ht-met; the fallbacks are the headless defaults.
const SYM = "var(--ht-sym, #ff5a3c)";
const MET = "var(--ht-met, #2563eb)";

function norm(xs: number[]): number[] {
  const min = Math.min(...xs), max = Math.max(...xs);
  const span = max - min || 1;
  return xs.map((v) => (v - min) / span);
}

/**
 * Width of an element, tracked with ResizeObserver so the chart stays crisp at any size (no stretched dots).
 * Uses a callback ref — not a mount-only effect — because this component can first render a "not enough
 * data" branch with no wrapper and only later flip to the chart; the observer must attach whenever the
 * element actually appears.
 */
function useWidth(initial = 320): [(el: HTMLDivElement | null) => void, number] {
  const [w, setW] = React.useState(initial);
  const ro = React.useRef<ResizeObserver | null>(null);
  const ref = React.useCallback((el: HTMLDivElement | null) => {
    ro.current?.disconnect();
    ro.current = null;
    if (!el || typeof ResizeObserver === "undefined") return;
    const apply = () => {
      const next = Math.round(el.getBoundingClientRect().width);
      if (next > 0) setW(next);
    };
    apply();
    ro.current = new ResizeObserver(apply);
    ro.current.observe(el);
  }, []);
  React.useEffect(() => () => { ro.current?.disconnect(); }, []);
  return [ref, w];
}

const shortDate = (iso: string) => {
  const d = new Date(`${iso.slice(0, 10)}T00:00:00Z`);
  return Number.isNaN(d.getTime()) ? iso.slice(5, 10) : d.toLocaleDateString(undefined, { month: "short", day: "numeric", timeZone: "UTC" });
};

export interface CorrelationViewProps {
  observations: Observation[];
  samples: Sample[];
  kind: SampleKind;
}

/**
 * Renders the symptom↔metric correlation for one wearable kind: a plain-language
 * verdict, the Pearson coefficient, and a dual sparkline. Pure — computes from the
 * @healthtwin/vitals engine over whatever observations/samples it's handed.
 */
export function CorrelationView({ observations, samples, kind }: CorrelationViewProps) {
  const c = React.useMemo(
    () => correlateSymptomWithMetric(observations, samples, kind),
    [observations, samples, kind],
  );
  const label = kind.replace(/_/g, " ");
  // Hooks must run on every render — keep these above the early return below.
  const gid = `ht-corr-${React.useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const [wrapRef, width] = useWidth();

  if (c.pearson == null) {
    return <p role="status" className="corr-verdict">Not enough overlapping days yet to correlate symptoms with {label}.</p>;
  }

  const r = c.pearson;
  const mag = Math.abs(r);
  const strength = mag > 0.6 ? "strong" : mag > 0.3 ? "moderate" : "weak";
  const direction = r < 0 ? "inverse" : "direct";

  const W = Math.max(240, width), H = 112, padX = 14, padY = 14, axis = 18;
  const denom = Math.max(1, c.points.length - 1);
  const xAt = (i: number) => padX + (i * (W - padX * 2)) / denom;
  const plotH = H - axis; // leave room for the date axis
  const yFrom = (vals: number[]) => norm(vals).map((v) => padY + (1 - v) * (plotH - padY * 2));
  const symY = yFrom(c.points.map((p) => p.meanIntensity));
  const metY = yFrom(c.points.map((p) => p.metric));
  const poly = (ys: number[]) => c.points.map((_, i) => `${xAt(i).toFixed(1)},${ys[i].toFixed(1)}`).join(" ");
  const area = `${xAt(0).toFixed(1)},${plotH - padY} ${poly(symY)} ${xAt(c.points.length - 1).toFixed(1)},${plotH - padY}`;
  const last = c.points.length - 1;
  return (
    <div className="corr">
      <p className="corr-verdict">
        <strong>{strength} {direction} correlation</strong> (r = {r.toFixed(2)}) between symptom
        intensity and {label} over {c.n} day{c.n === 1 ? "" : "s"}.
      </p>
      <div ref={wrapRef} className="corr-wrap">
      <svg className="corr-plot" viewBox={`0 0 ${W} ${H}`} width={W} height={H} role="img"
        aria-label={`${strength} ${direction} correlation, r ${r.toFixed(2)}, over ${c.n} days`}>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" style={{ stopColor: SYM }} stopOpacity="0.28" />
            <stop offset="1" style={{ stopColor: SYM }} stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((f) => (
          <line key={f} className="corr-grid" x1={padX} x2={W - padX} y1={padY + f * (plotH - padY * 2)} y2={padY + f * (plotH - padY * 2)} />
        ))}
        <polygon points={area} fill={`url(#${gid})`} />
        <polyline points={poly(metY)} fill="none" style={{ stroke: MET }} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        <polyline points={poly(symY)} fill="none" style={{ stroke: SYM }} strokeWidth={2.25} strokeLinecap="round" strokeLinejoin="round" />
        {c.points.map((_, i) => (
          <circle key={i} className="corr-dot" cx={xAt(i)} cy={symY[i]} r={i === last ? 3.6 : 2.2} style={{ fill: SYM }} />
        ))}
        <circle className="corr-dot" cx={xAt(last)} cy={metY[last]} r={3.6} style={{ fill: MET }} />
        <text className="corr-axis" x={padX} y={H - 5} textAnchor="start">{shortDate(c.points[0].date)}</text>
        <text className="corr-axis" x={W - padX} y={H - 5} textAnchor="end">{shortDate(c.points[last].date)}</text>
      </svg>
      </div>
      <p className="corr-legend">
        <span><span className="sw" style={{ background: SYM }} /> symptom intensity</span>
        <span><span className="sw" style={{ background: MET }} /> {label}</span>
      </p>
    </div>
  );
}
