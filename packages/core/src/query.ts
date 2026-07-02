import type { Observation, Side, ObservationType, ISO } from "./types";

export interface ObservationFilter {
  regionId?: string;
  side?: Side;
  type?: ObservationType;
  from?: ISO;
  to?: ISO;
}

export function queryObservations(current: Observation[], f: ObservationFilter = {}): Observation[] {
  return current
    .filter((o) => !f.regionId || o.location.regionId === f.regionId)
    .filter((o) => !f.side || o.location.side === f.side)
    .filter((o) => !f.type || o.type === f.type)
    .filter((o) => !f.from || o.occurredAt >= f.from)
    .filter((o) => !f.to || o.occurredAt <= f.to)
    .slice()
    .sort((a, b) => (a.occurredAt < b.occurredAt ? 1 : a.occurredAt > b.occurredAt ? -1 : 0));
}
