import { z } from "zod";
import { newId, nowISO, type ID, type ISO } from "@healthtwin/core";
import { SAMPLE_KINDS, type Sample, type SampleKind } from "./types";

export const SampleSchema = z.object({
  id: z.string().length(26),
  subjectId: z.string().min(1),
  kind: z.enum(SAMPLE_KINDS as unknown as [string, ...string[]]),
  value: z.number().finite(),
  unit: z.string().min(1),
  at: z.string().min(1),
  source: z.string().min(1),
});

export interface NewSample {
  kind: SampleKind;
  value: number;
  unit: string;
  at?: ISO;
  source?: string;
}

export interface SampleContext {
  subjectId: ID;
  source?: string;
}

export function createSample(input: NewSample, ctx: SampleContext): Sample {
  const candidate: Sample = {
    id: newId(),
    subjectId: ctx.subjectId,
    kind: input.kind,
    value: input.value,
    unit: input.unit,
    at: input.at ?? nowISO(),
    source: input.source ?? ctx.source ?? "manual",
  };
  return SampleSchema.parse(candidate) as Sample;
}
