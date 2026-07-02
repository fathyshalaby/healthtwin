import { createSample, type SampleContext } from "./schema";
import type { Sample, SampleKind } from "./types";

type Mapped = { kind: SampleKind; unit: string };

// --- Apple HealthKit ---------------------------------------------------------

/** A minimal record shape partners pass from HKSample queries. */
export interface HealthKitRecord {
  type: string; // HKQuantityTypeIdentifier* / HKCategoryTypeIdentifier*
  value: number;
  unit?: string;
  startDate: string; // ISO
  sourceName?: string;
}

// Note: sleep is intentionally NOT auto-mapped. HKCategoryTypeIdentifierSleepAnalysis /
// com.google.sleep.segment carry a sleep-STAGE enum code (not a minutes duration), so
// naively storing `value` as sleep_minutes yields garbage. Deriving minutes needs the
// segment's start+end; feed that in as a computed `sleep_minutes` Sample instead.
const HK_MAP: Record<string, Mapped> = {
  HKQuantityTypeIdentifierHeartRate: { kind: "heart_rate", unit: "bpm" },
  HKQuantityTypeIdentifierStepCount: { kind: "steps", unit: "count" },
  HKQuantityTypeIdentifierActiveEnergyBurned: { kind: "active_energy", unit: "kcal" },
  HKQuantityTypeIdentifierBodyMass: { kind: "weight", unit: "kg" },
  HKQuantityTypeIdentifierOxygenSaturation: { kind: "spo2", unit: "%" },
  HKQuantityTypeIdentifierBloodPressureSystolic: { kind: "bp_systolic", unit: "mmHg" },
  HKQuantityTypeIdentifierBloodPressureDiastolic: { kind: "bp_diastolic", unit: "mmHg" },
};

export function fromHealthKit(records: HealthKitRecord[], ctx: SampleContext): Sample[] {
  return records.flatMap((r) => {
    const m = HK_MAP[r.type];
    if (!m) return [];
    return [createSample(
      { kind: m.kind, value: r.value, unit: r.unit ?? m.unit, at: r.startDate, source: r.sourceName ?? "healthkit" },
      ctx,
    )];
  });
}

// --- Google Fit --------------------------------------------------------------

/** A point from a Google Fit dataset (dataset.point[]). */
export interface GoogleFitPoint {
  dataTypeName: string;
  value: Array<{ fpVal?: number; intVal?: number }>;
  startTimeNanos: string;
}

const GF_MAP: Record<string, Mapped> = {
  "com.google.heart_rate.bpm": { kind: "heart_rate", unit: "bpm" },
  "com.google.step_count.delta": { kind: "steps", unit: "count" },
  "com.google.calories.expended": { kind: "active_energy", unit: "kcal" },
  "com.google.weight": { kind: "weight", unit: "kg" },
  "com.google.oxygen_saturation": { kind: "spo2", unit: "%" },
};

export function fromGoogleFit(points: GoogleFitPoint[], ctx: SampleContext): Sample[] {
  return points.flatMap((p) => {
    const m = GF_MAP[p.dataTypeName];
    if (!m) return [];
    const raw = p.value[0]?.fpVal ?? p.value[0]?.intVal;
    if (raw == null) return [];
    const at = new Date(Number(BigInt(p.startTimeNanos) / 1_000_000n)).toISOString();
    return [createSample({ kind: m.kind, value: raw, unit: m.unit, at, source: "googlefit" }, ctx)];
  });
}
