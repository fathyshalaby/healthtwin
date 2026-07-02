import {
  foldLog, queryObservations, getRegion,
  type Observation, type Side, type ISO,
} from "@healthtwin/core";
import type { RegionStat, Flare, ContextCorrelation, TwinSummary, Trend } from "./types";

const rkey = (regionId: string, side: Side) => `${regionId}:${side}`;
const dayOf = (iso: ISO) => iso.slice(0, 10);

function labelOf(regionId: string, side: Side): string {
  const base = getRegion(regionId)?.label ?? regionId;
  if (side === "central") return base;
  return `${side === "left" ? "Left" : "Right"} ${base}`;
}

// Compare the first vs last half of a chronological intensity series.
function trendOf(intensities: number[]): Trend {
  if (intensities.length < 3) return "insufficient";
  const mean = (a: number[]) => a.reduce((s, x) => s + x, 0) / a.length;
  const mid = Math.floor(intensities.length / 2);
  const delta = mean(intensities.slice(intensities.length - mid)) - mean(intensities.slice(0, mid));
  if (delta > 1) return "worsening";
  if (delta < -1) return "improving";
  return "stable";
}

export function regionStats(observations: Observation[]): RegionStat[] {
  const groups = new Map<string, Observation[]>();
  for (const o of observations) {
    const k = rkey(o.location.regionId, o.location.side);
    const arr = groups.get(k);
    if (arr) arr.push(o);
    else groups.set(k, [o]);
  }

  const stats: RegionStat[] = [];
  for (const obs of groups.values()) {
    const sorted = [...obs].sort((a, b) => (a.occurredAt < b.occurredAt ? -1 : 1));
    const intensities = sorted.map((o) => o.intensity).filter((v): v is number => v != null);
    const head = sorted[0];
    stats.push({
      regionId: head.location.regionId,
      side: head.location.side,
      label: labelOf(head.location.regionId, head.location.side),
      count: obs.length,
      meanIntensity: intensities.length ? intensities.reduce((s, x) => s + x, 0) / intensities.length : null,
      maxIntensity: intensities.length ? Math.max(...intensities) : null,
      lastOccurredAt: sorted[sorted.length - 1].occurredAt,
      trend: trendOf(intensities),
    });
  }
  return stats.sort((a, b) => b.count - a.count);
}

export function detectFlares(observations: Observation[], threshold = 7): Flare[] {
  return observations
    .filter((o) => o.intensity != null && (o.intensity as number) >= threshold)
    .map((o) => ({
      regionId: o.location.regionId,
      side: o.location.side,
      label: labelOf(o.location.regionId, o.location.side),
      at: o.occurredAt,
      intensity: o.intensity as number,
    }))
    .sort((a, b) => (a.at < b.at ? 1 : -1));
}

export function contextCorrelations(observations: Observation[]): ContextCorrelation[] {
  const counts = new Map<string, number>();
  const intensities = new Map<string, number[]>();
  for (const o of observations) {
    for (const tag of o.contextTags ?? []) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
      if (o.intensity != null) {
        const arr = intensities.get(tag);
        if (arr) arr.push(o.intensity);
        else intensities.set(tag, [o.intensity]);
      }
    }
  }
  return [...counts.entries()]
    .map(([tag, count]) => {
      const vs = intensities.get(tag) ?? [];
      return { tag, count, meanIntensity: vs.length ? vs.reduce((s, x) => s + x, 0) / vs.length : null };
    })
    .sort((a, b) => (b.meanIntensity ?? 0) - (a.meanIntensity ?? 0));
}

// Consecutive days (ending at the most recent entry) with at least one entry.
export function currentStreak(observations: Observation[]): number {
  if (observations.length === 0) return 0;
  const days = [...new Set(observations.map((o) => dayOf(o.occurredAt)))].sort().reverse();
  let streak = 1;
  for (let i = 1; i < days.length; i++) {
    const expected = new Date(new Date(`${days[i - 1]}T00:00:00Z`).getTime() - 86_400_000)
      .toISOString().slice(0, 10);
    if (days[i] === expected) streak++;
    else break;
  }
  return streak;
}

export function summarize(observations: Observation[], opts: { from?: ISO; to?: ISO } = {}): TwinSummary {
  const live = queryObservations(foldLog(observations), { from: opts.from, to: opts.to });
  const stats = regionStats(live);
  const byType: Record<string, number> = {};
  for (const o of live) byType[o.type] = (byType[o.type] ?? 0) + 1;

  return {
    range: { from: opts.from, to: opts.to },
    total: live.length,
    activeRegions: stats.length,
    byType,
    topRegions: stats.slice(0, 5),
    worsening: stats.filter((s) => s.trend === "worsening"),
    flares: detectFlares(live),
    contexts: contextCorrelations(live),
    streakDays: currentStreak(live),
    lastEntryAt: live.length ? [...live.map((o) => o.occurredAt)].sort().reverse()[0] : null,
  };
}
