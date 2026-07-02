import { openDB, type IDBPDatabase } from "idb";
import type { SyncMeta, Cursor, ULID } from "@healthtwin/core";

const META = "meta";
const SYNCED = "synced";

async function db(name: string): Promise<IDBPDatabase> {
  return openDB(name, 1, {
    upgrade(d) {
      if (!d.objectStoreNames.contains(META)) d.createObjectStore(META);
      if (!d.objectStoreNames.contains(SYNCED)) d.createObjectStore(SYNCED);
    },
  });
}

export function createIdbSyncMeta(dbName = "healthtwin-sync"): SyncMeta {
  return {
    async getCursor(): Promise<Cursor> {
      const d = await db(dbName);
      return (await d.get(META, "cursor")) as Cursor;
    },
    async setCursor(c: Cursor): Promise<void> {
      const d = await db(dbName);
      await d.put(META, c, "cursor");
    },
    async syncedIds(): Promise<Set<ULID>> {
      const d = await db(dbName);
      return new Set((await d.getAllKeys(SYNCED)) as ULID[]);
    },
    async markSynced(ids: ULID[]): Promise<void> {
      const d = await db(dbName);
      const tx = d.transaction(SYNCED, "readwrite");
      for (const id of ids) await tx.store.put(true, id);
      await tx.done;
    },
  };
}
