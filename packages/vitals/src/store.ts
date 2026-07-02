import type { Sample } from "./types";

export interface SampleStore {
  all(): Promise<Sample[]>;
  append(sample: Sample): Promise<void>;
}

export function createMemorySampleStore(): SampleStore {
  const rows: Sample[] = [];
  return {
    async all() { return [...rows]; },
    async append(sample) {
      if (!rows.some((r) => r.id === sample.id)) rows.push(sample);
    },
  };
}
