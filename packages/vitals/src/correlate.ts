import { foldLog, type Observation } from "@healthtwin/core";
import type { Sample, SampleKind } from "./types";
import { dailySeries } from "./query";

export interface CorrelationPoint {
  date: string;
  meanIntensity: number;
  metric: number;
}

export interface Correlation {
  kind: SampleKind;
  n: number;
  pearson: number | null; // null when fewer than 2 overlapping days or no variance
  points: CorrelationPoint[];
}

function pearson(xs: number[], ys: number[]): number | null {
  const n = xs.length;
  if (n < 2) return null;
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let sxy = 0, sxx = 0, syy = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - mx, dy = ys[i] - my;
    sxy += dx * dy; sxx += dx * dx; syy += dy * dy;
  }
  if (sxx === 0 || syy === 0) return null;
  return sxy / Math.sqrt(sxx * syy);
}

/**
 * Line up daily mean symptom intensity against a daily metric rollup (e.g. sleep
 * minutes) on shared days, and report the Pearson correlation. This is the
 * "flare-ups vs. poor sleep" signal.
 */
export function correlateSymptomWithMetric(
  observations: Observation[],
  samples: Sample[],
  kind: SampleKind,
): Correlation {
  const live = foldLog(observations);

  const intensityByDay = new Map<string, number[]>();
  for (const o of live) {
    if (o.intensity == null) continue;
    const day = o.occurredAt.slice(0, 10);
    const arr = intensityByDay.get(day);
    if (arr) arr.push(o.intensity);
    else intensityByDay.set(day, [o.intensity]);
  }

  const metricByDay = new Map(dailySeries(samples, kind).map((d) => [d.date, d.value]));

  const points: CorrelationPoint[] = [];
  for (const [date, vals] of intensityByDay) {
    const metric = metricByDay.get(date);
    if (metric == null) continue;
    points.push({ date, meanIntensity: vals.reduce((a, b) => a + b, 0) / vals.length, metric });
  }
  points.sort((a, b) => (a.date < b.date ? -1 : 1));

  return {
    kind,
    n: points.length,
    pearson: pearson(points.map((p) => p.meanIntensity), points.map((p) => p.metric)),
    points,
  };
}
