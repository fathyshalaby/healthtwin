import * as React from "react";
import type { Observation } from "@healthtwin/core";
import { correlateSymptomWithMetric, type Sample, type SampleKind } from "@healthtwin/vitals";

const SYM = "#ff5a3c";
const MET = "#2563eb";

function norm(xs: number[]): number[] {
  const min = Math.min(...xs), max = Math.max(...xs);
  const span = max - min || 1;
  return xs.map((v) => (v - min) / span);
}

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

  if (c.pearson == null) {
    return <p role="status">Not enough overlapping days yet to correlate symptoms with {label}.</p>;
  }

  const r = c.pearson;
  const mag = Math.abs(r);
  const strength = mag > 0.6 ? "strong" : mag > 0.3 ? "moderate" : "weak";
  const direction = r < 0 ? "inverse" : "direct";

  const W = 300, H = 72, padX = 6, padY = 8;
  const denom = Math.max(1, c.points.length - 1);
  const xAt = (i: number) => padX + (i * (W - padX * 2)) / denom;
  const yFrom = (vals: number[]) => norm(vals).map((v) => padY + (1 - v) * (H - padY * 2));
  const symY = yFrom(c.points.map((p) => p.meanIntensity));
  const metY = yFrom(c.points.map((p) => p.metric));
  const poly = (ys: number[]) => c.points.map((_, i) => `${xAt(i).toFixed(1)},${ys[i].toFixed(1)}`).join(" ");

  return (
    <div>
      <p>
        <strong>{strength} {direction} correlation</strong> (r = {r.toFixed(2)}) between symptom
        intensity and {label} over {c.n} day{c.n === 1 ? "" : "s"}.
      </p>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} role="img"
        aria-label={`${strength} ${direction} correlation, r ${r.toFixed(2)}, over ${c.n} days`}>
        <polyline points={poly(symY)} fill="none" stroke={SYM} strokeWidth={2} strokeLinejoin="round" />
        <polyline points={poly(metY)} fill="none" stroke={MET} strokeWidth={2} strokeLinejoin="round" />
      </svg>
      <p style={{ fontSize: 12, color: "#54677a", margin: "4px 0 0" }}>
        <span style={{ color: SYM }}>■</span> symptom intensity{"    "}
        <span style={{ color: MET }}>■</span> {label}
      </p>
    </div>
  );
}
