import type { Sample, SampleKind } from "./types";
import type { ISO } from "@healthtwin/core";

export interface SampleFilter {
  kind?: SampleKind;
  from?: ISO;
  to?: ISO;
}

export function querySamples(samples: Sample[], f: SampleFilter = {}): Sample[] {
  return samples
    .filter((s) => !f.kind || s.kind === f.kind)
    .filter((s) => !f.from || s.at >= f.from)
    .filter((s) => !f.to || s.at <= f.to)
    .slice()
    .sort((a, b) => (a.at < b.at ? -1 : a.at > b.at ? 1 : 0));
}

const SUM_KINDS = new Set<SampleKind>(["steps", "active_energy", "sleep_minutes", "workout"]);
const aggFor = (kind: SampleKind, override?: "sum" | "mean") => override ?? (SUM_KINDS.has(kind) ? "sum" : "mean");

export interface DayValue { date: string; value: number; }

/** Per-day rollup for a metric — sum for counters (steps/energy/sleep), mean otherwise. */
export function dailySeries(samples: Sample[], kind: SampleKind, agg?: "sum" | "mean"): DayValue[] {
  const byDay = new Map<string, number[]>();
  for (const s of samples) {
    if (s.kind !== kind) continue;
    const day = s.at.slice(0, 10);
    const arr = byDay.get(day);
    if (arr) arr.push(s.value);
    else byDay.set(day, [s.value]);
  }
  const mode = aggFor(kind, agg);
  return [...byDay.entries()]
    .map(([date, vals]) => ({
      date,
      value: mode === "sum" ? vals.reduce((a, b) => a + b, 0) : vals.reduce((a, b) => a + b, 0) / vals.length,
    }))
    .sort((a, b) => (a.date < b.date ? -1 : 1));
}

export function latest(samples: Sample[], kind: SampleKind): Sample | null {
  let best: Sample | null = null;
  for (const s of samples) {
    if (s.kind === kind && (!best || s.at > best.at)) best = s;
  }
  return best;
}
