import type { Observation, Side, ObservationType, ISO, RegionKey } from "./types";
import { regionKey } from "./taxonomy";

export interface ObservationFilter {
  regionId?: string;
  side?: Side;
  type?: ObservationType;
  from?: ISO;
  to?: ISO;
}

export function queryObservations(current: Observation[], f: ObservationFilter = {}): Observation[] {
  return current
    .filter((o) => !f.regionId || o.location.regionId === f.regionId)
    .filter((o) => !f.side || o.location.side === f.side)
    .filter((o) => !f.type || o.type === f.type)
    .filter((o) => !f.from || o.occurredAt >= f.from)
    .filter((o) => !f.to || o.occurredAt <= f.to)
    .slice()
    .sort((a, b) => (a.occurredAt < b.occurredAt ? 1 : a.occurredAt > b.occurredAt ? -1 : 0));
}

export type HeatmapMetric = "frequency" | "meanIntensity" | "recency";

/** Aggregate observations into a per-region metric value (keyed by RegionKey). */
export function computeHeatmap(
  current: Observation[],
  opts: { metric: HeatmapMetric; from?: ISO; to?: ISO },
): Map<RegionKey, number> {
  const rows = queryObservations(current, { from: opts.from, to: opts.to });
  const groups = new Map<RegionKey, Observation[]>();
  for (const o of rows) {
    const k = regionKey(o.location);
    const arr = groups.get(k);
    if (arr) arr.push(o);
    else groups.set(k, [o]);
  }

  const out = new Map<RegionKey, number>();
  for (const [k, obs] of groups) {
    if (opts.metric === "frequency") {
      out.set(k, obs.length);
    } else if (opts.metric === "meanIntensity") {
      const vals = obs.map((o) => o.intensity).filter((v): v is number => v != null);
      if (vals.length > 0) out.set(k, vals.reduce((a, b) => a + b, 0) / vals.length);
    } else {
      // recency: most-recent occurredAt as epoch ms (normalized later → newest = hottest)
      out.set(k, Math.max(...obs.map((o) => Date.parse(o.occurredAt))));
    }
  }
  return out;
}

export interface DayGroup {
  date: string; // YYYY-MM-DD
  items: Observation[];
}

/** Group observations by calendar day (UTC), newest day first, newest item first. */
export function buildTimeline(current: Observation[], f: ObservationFilter = {}): DayGroup[] {
  const rows = queryObservations(current, f);
  const map = new Map<string, Observation[]>();
  for (const o of rows) {
    const date = o.occurredAt.slice(0, 10);
    const arr = map.get(date);
    if (arr) arr.push(o);
    else map.set(date, [o]);
  }
  return [...map.entries()].map(([date, items]) => ({ date, items }));
}
