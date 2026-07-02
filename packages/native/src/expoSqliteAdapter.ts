import type { SqlDb } from "./sqlDb";

/**
 * Structural subset of expo-sqlite's SQLiteDatabase (declared locally so this
 * package needs no expo dependency). On device:
 *
 *   import * as SQLite from "expo-sqlite";
 *   const db = await SQLite.openDatabaseAsync("healthtwin.db");
 *   const store = await createSqliteStore(expoSqliteAdapter(db));
 */
export interface ExpoSqliteDatabase {
  execAsync(sql: string): Promise<void>;
  runAsync(sql: string, params?: unknown[]): Promise<unknown>;
  getAllAsync<T>(sql: string, params?: unknown[]): Promise<T[]>;
}

export function expoSqliteAdapter(database: ExpoSqliteDatabase): SqlDb {
  return {
    async exec(sql, params) {
      if (params && params.length > 0) await database.runAsync(sql, params);
      else await database.execAsync(sql);
    },
    async query<T>(sql: string, params?: unknown[]): Promise<T[]> {
      return database.getAllAsync<T>(sql, params);
    },
  };
}
