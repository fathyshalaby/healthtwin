import type { Observation } from "./types";

export interface LocalStore {
  all(): Promise<Observation[]>;
  append(record: Observation): Promise<void>;
}

export function createMemoryStore(): LocalStore {
  const rows: Observation[] = [];
  return {
    async all() { return [...rows]; },
    async append(record) { rows.push(record); },
  };
}
