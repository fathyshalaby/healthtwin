import type { ULID, ISO, ID } from "@healthtwin/core";

// Vitals / activity time-series — distinct from symptom Observations, but correlatable.
export const SAMPLE_KINDS = [
  "heart_rate", "steps", "active_energy", "sleep_minutes",
  "bp_systolic", "bp_diastolic", "weight", "spo2", "workout", "other",
] as const;

export type SampleKind = (typeof SAMPLE_KINDS)[number];

export interface Sample {
  id: ULID;
  subjectId: ID;
  kind: SampleKind;
  value: number;
  unit: string;
  at: ISO;         // when the reading was taken
  source: string;  // "healthkit" | "googlefit" | "manual" | partner name
}
