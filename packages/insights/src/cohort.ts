import { foldLog, type Observation, type Side } from "@healthtwin/core";
import { regionStats } from "./engine";

export interface CohortRegion {
  regionId: string;
  side: Side;
  label: string;
  count: number;
}

export interface CohortSummary {
  users: number;
  totalEntries: number;
  activeUsers: number; // users with an entry within the active window
  meanEntriesPerUser: number;
  topRegions: CohortRegion[];
  byType: Record<string, number>;
}

/** Partner-level analytics across many subjects' observations (scope by partner_id upstream). */
export function cohortSummary(
  observations: Observation[],
  opts: { activeWindowDays?: number; now?: string } = {},
): CohortSummary {
  const live = foldLog(observations);

  const bySubject = new Map<string, Observation[]>();
  for (const o of live) {
    const arr = bySubject.get(o.subjectId);
    if (arr) arr.push(o);
    else bySubject.set(o.subjectId, [o]);
  }

  const now = opts.now ? Date.parse(opts.now) : Date.now();
  const cutoff = now - (opts.activeWindowDays ?? 30) * 86_400_000;
  let activeUsers = 0;
  for (const obs of bySubject.values()) {
    if (obs.some((o) => Date.parse(o.occurredAt) >= cutoff)) activeUsers += 1;
  }

  const byType: Record<string, number> = {};
  for (const o of live) byType[o.type] = (byType[o.type] ?? 0) + 1;

  const topRegions = regionStats(live).slice(0, 5).map((s) => ({
    regionId: s.regionId, side: s.side, label: s.label, count: s.count,
  }));

  return {
    users: bySubject.size,
    totalEntries: live.length,
    activeUsers,
    meanEntriesPerUser: bySubject.size ? live.length / bySubject.size : 0,
    topRegions,
    byType,
  };
}
