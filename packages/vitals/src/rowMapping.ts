import type { Sample } from "./types";

/** Postgres row shape for the `samples` table (see migration 0008). */
export interface SampleRow {
  id: string;
  subject_id: string;
  kind: string;
  value: number;
  unit: string;
  at: string;
  source: string;
  partner_id?: string | null;
}

export function toSampleRow(s: Sample): SampleRow {
  return {
    id: s.id,
    subject_id: s.subjectId,
    kind: s.kind,
    value: s.value,
    unit: s.unit,
    at: s.at,
    source: s.source,
  };
}

export function fromSampleRow(r: SampleRow): Sample {
  return {
    id: r.id,
    subjectId: r.subject_id,
    kind: r.kind as Sample["kind"],
    value: r.value,
    unit: r.unit,
    at: new Date(r.at).toISOString(),
    source: r.source,
  };
}
