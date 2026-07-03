import { openDB, type IDBPDatabase } from "idb";
import type { Sample, SampleStore } from "@healthtwin/vitals";

const STORE = "samples";

async function db(name: string): Promise<IDBPDatabase> {
  return openDB(name, 1, {
    upgrade(d) {
      if (!d.objectStoreNames.contains(STORE)) d.createObjectStore(STORE, { keyPath: "id" });
    },
  });
}

/** IndexedDB-backed SampleStore for offline-first vitals (separate db from observations). */
export function createIdbSampleStore(dbName = "healthtwin-vitals"): SampleStore {
  return {
    async all(): Promise<Sample[]> {
      const d = await db(dbName);
      return (await d.getAll(STORE)) as Sample[];
    },
    async append(record: Sample): Promise<void> {
      const d = await db(dbName);
      await d.put(STORE, record); // idempotent by id
    },
  };
}
