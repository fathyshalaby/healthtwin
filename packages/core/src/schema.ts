import { z } from "zod";
import type { Observation, ID } from "./types";
import { newId, nowISO } from "./ids";
import { TAXONOMY_VERSION, getRegion } from "./taxonomy";

const LocationSchema = z.object({
  regionId: z.string().min(1),
  side: z.enum(["left", "right", "central"]),
  view: z.enum(["anterior", "posterior"]),
  point: z.object({ x: z.number().min(0).max(1), y: z.number().min(0).max(1) }).optional(),
});

export const ObservationSchema = z.object({
  id: z.string().length(26),
  subjectId: z.string().min(1),
  occurredAt: z.string().min(1),
  createdAt: z.string().min(1),
  location: LocationSchema,
  type: z.enum(["pain", "stiffness", "numbness", "tingling", "swelling", "weakness", "other"]),
  quality: z.array(z.enum(["sharp", "dull", "burning", "throbbing", "aching", "stabbing", "cramping"])).optional(),
  intensity: z.number().min(0).max(10).optional(),
  note: z.string().max(2000).optional(),
  contextTags: z.array(z.string().min(1)).optional(),
  taxonomyVersion: z.string().min(1),
  supersedes: z.string().length(26).optional(),
  tombstone: z.boolean().optional(),
  origin: z.string().min(1),
});

export interface NewObservation {
  location: Observation["location"];
  type: Observation["type"];
  quality?: Observation["quality"];
  intensity?: number;
  note?: string;
  contextTags?: string[];
  occurredAt?: string;
}

export interface ObservationContext {
  subjectId: ID;
  origin: ID;
}

export function createObservation(input: NewObservation, ctx: ObservationContext): Observation {
  if (!getRegion(input.location.regionId)) {
    throw new Error(`Unknown region: ${input.location.regionId}`);
  }
  const createdAt = nowISO();
  const candidate: Observation = {
    id: newId(),
    subjectId: ctx.subjectId,
    origin: ctx.origin,
    createdAt,
    occurredAt: input.occurredAt ?? createdAt,
    location: input.location,
    type: input.type,
    quality: input.quality,
    intensity: input.intensity,
    note: input.note,
    contextTags: input.contextTags,
    taxonomyVersion: TAXONOMY_VERSION,
  };
  return ObservationSchema.parse(candidate) as Observation;
}
