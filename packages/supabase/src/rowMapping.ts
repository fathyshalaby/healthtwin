import type { Observation } from "@healthtwin/core";

/** Database row shape for the `observations` table. */
export interface ObservationRow {
  id: string;
  subject_id: string;
  occurred_at: string;
  created_at: string;
  location: unknown;
  type: string;
  quality: string[] | null;
  intensity: number | null;
  note: string | null;
  context_tags: string[] | null;
  taxonomy_version: string;
  supersedes: string | null;
  tombstone: boolean | null;
  origin: string;
  seq?: number; // server-assigned monotonic sequence (pull cursor)
}

export function toRow(o: Observation): ObservationRow {
  return {
    id: o.id,
    subject_id: o.subjectId,
    occurred_at: o.occurredAt,
    created_at: o.createdAt,
    location: o.location,
    type: o.type,
    quality: o.quality ?? null,
    intensity: o.intensity ?? null,
    note: o.note ?? null,
    context_tags: o.contextTags ?? null,
    taxonomy_version: o.taxonomyVersion,
    supersedes: o.supersedes ?? null,
    tombstone: o.tombstone ?? null,
    origin: o.origin,
  };
}

export function fromRow(r: ObservationRow): Observation {
  return {
    id: r.id,
    subjectId: r.subject_id,
    occurredAt: r.occurred_at,
    createdAt: r.created_at,
    location: r.location as Observation["location"],
    type: r.type as Observation["type"],
    quality: (r.quality ?? undefined) as Observation["quality"],
    intensity: r.intensity ?? undefined,
    note: r.note ?? undefined,
    contextTags: r.context_tags ?? undefined,
    taxonomyVersion: r.taxonomy_version,
    supersedes: r.supersedes ?? undefined,
    tombstone: r.tombstone ?? undefined,
    origin: r.origin,
  };
}
