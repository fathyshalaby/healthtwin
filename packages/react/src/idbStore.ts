import { openDB, type IDBPDatabase } from "idb";
import type { LocalStore, Observation } from "@healthtwin/core";

const STORE = "observations";

async function db(name: string): Promise<IDBPDatabase> {
  return openDB(name, 1, {
    upgrade(d) {
      if (!d.objectStoreNames.contains(STORE)) d.createObjectStore(STORE, { keyPath: "id" });
    },
  });
}

export function createIdbStore(dbName = "healthtwin"): LocalStore {
  return {
    async all(): Promise<Observation[]> {
      const d = await db(dbName);
      return (await d.getAll(STORE)) as Observation[];
    },
    async append(record: Observation): Promise<void> {
      const d = await db(dbName);
      await d.put(STORE, record);
    },
  };
}
