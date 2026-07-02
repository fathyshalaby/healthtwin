import type { LocalStore, Observation } from "@healthtwin/core";
import type { SqlDb } from "./sqlDb";

const CREATE = "create table if not exists observations (id text primary key, data text not null)";

/**
 * A LocalStore backed by SQLite. Observations are stored as JSON keyed by id,
 * keeping the mapping trivial and lossless. Works with any SqlDb (see the
 * expo-sqlite adapter for on-device use).
 */
export async function createSqliteStore(db: SqlDb): Promise<LocalStore> {
  await db.exec(CREATE);
  return {
    async all(): Promise<Observation[]> {
      const rows = await db.query<{ data: string }>("select data from observations");
      return rows.map((r) => JSON.parse(r.data) as Observation);
    },
    async append(record: Observation): Promise<void> {
      await db.exec(
        "insert or replace into observations (id, data) values (?, ?)",
        [record.id, JSON.stringify(record)],
      );
    },
  };
}
