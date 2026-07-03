import type { Sample, SampleStore } from "@healthtwin/vitals";
import type { SqlDb } from "./sqlDb";

const CREATE = "create table if not exists samples (id text primary key, data text not null)";

/**
 * A SampleStore backed by SQLite for on-device vitals (wearable samples), mirroring
 * createSqliteStore for observations. Samples are stored as JSON keyed by id, so the
 * mapping is trivial and lossless. Pair with runSampleSync + createSampleCloudAdapter
 * for offline-first sync. On device:
 *
 *   const db = await SQLite.openDatabaseAsync("healthtwin.db");
 *   const samples = await createSqliteSampleStore(expoSqliteAdapter(db));
 */
export async function createSqliteSampleStore(db: SqlDb): Promise<SampleStore> {
  await db.exec(CREATE);
  return {
    async all(): Promise<Sample[]> {
      const rows = await db.query<{ data: string }>("select data from samples");
      return rows.map((r) => JSON.parse(r.data) as Sample);
    },
    async append(record: Sample): Promise<void> {
      await db.exec(
        "insert or replace into samples (id, data) values (?, ?)",
        [record.id, JSON.stringify(record)],
      );
    },
  };
}
