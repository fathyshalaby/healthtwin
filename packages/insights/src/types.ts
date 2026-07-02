import type { ISO, Side } from "@healthtwin/core";

export type Trend = "worsening" | "improving" | "stable" | "insufficient";

export interface RegionStat {
  regionId: string;
  side: Side;
  label: string;
  count: number;
  meanIntensity: number | null;
  maxIntensity: number | null;
  lastOccurredAt: ISO;
  trend: Trend;
}

export interface Flare {
  regionId: string;
  side: Side;
  label: string;
  at: ISO;
  intensity: number;
}

export interface ContextCorrelation {
  tag: string;
  count: number;
  meanIntensity: number | null;
}

export interface TwinSummary {
  range: { from?: ISO; to?: ISO };
  total: number;
  activeRegions: number;
  byType: Record<string, number>;
  topRegions: RegionStat[];
  worsening: RegionStat[];
  flares: Flare[];
  contexts: ContextCorrelation[];
  streakDays: number;
  lastEntryAt: ISO | null;
}
