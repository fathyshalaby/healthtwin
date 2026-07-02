/** Minimal SQL execution seam so the store logic is testable without a native driver. */
export interface SqlDb {
  exec(sql: string, params?: unknown[]): Promise<void>;
  query<T>(sql: string, params?: unknown[]): Promise<T[]>;
}
