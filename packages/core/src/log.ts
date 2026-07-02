import type { Observation, ULID } from "./types";

export function foldLog(all: Observation[]): Observation[] {
  const superseded = new Set<ULID>();
  for (const o of all) if (o.supersedes) superseded.add(o.supersedes);
  return all.filter((o) => !superseded.has(o.id) && !o.tombstone);
}
