import type { Observation, ULID } from "./types";
import type { LocalStore } from "./store";

export type Cursor = string | undefined;

export interface PullPage {
  records: Observation[];
  cursor: Cursor;
}

/**
 * A backend the sync engine can talk to. Because observations are immutable and
 * ULID-keyed, push/pull are idempotent — no merge/conflict logic is required.
 */
export interface SyncAdapter {
  push(records: Observation[]): Promise<{ acked: ULID[] }>;
  pull(cursor?: Cursor): Promise<PullPage>;
}

/** Per-device sync bookkeeping: the pull cursor and which record ids are known-synced. */
export interface SyncMeta {
  getCursor(): Promise<Cursor>;
  setCursor(c: Cursor): Promise<void>;
  syncedIds(): Promise<Set<ULID>>;
  markSynced(ids: ULID[]): Promise<void>;
}

export interface SyncResult {
  pushed: number;
  pulled: number;
}

/**
 * One sync pass: push local records the backend hasn't acked, then pull remote
 * records since the cursor and append any not already present. Idempotent.
 */
export async function runSync(
  store: LocalStore,
  meta: SyncMeta,
  adapter: SyncAdapter,
): Promise<SyncResult> {
  const local = await store.all();
  const synced = await meta.syncedIds();

  const toPush = local.filter((o) => !synced.has(o.id));
  if (toPush.length > 0) {
    const { acked } = await adapter.push(toPush);
    await meta.markSynced(acked);
  }

  const cursor = await meta.getCursor();
  const page = await adapter.pull(cursor);
  const existing = new Set(local.map((o) => o.id));
  const incoming = page.records.filter((r) => !existing.has(r.id));
  for (const r of incoming) await store.append(r);
  if (page.records.length > 0) await meta.markSynced(page.records.map((r) => r.id));
  await meta.setCursor(page.cursor);

  return { pushed: toPush.length, pulled: incoming.length };
}

export function createMemorySyncMeta(): SyncMeta {
  let cursor: Cursor = undefined;
  const synced = new Set<ULID>();
  return {
    async getCursor() { return cursor; },
    async setCursor(c) { cursor = c; },
    async syncedIds() { return new Set(synced); },
    async markSynced(ids) { for (const id of ids) synced.add(id); },
  };
}
