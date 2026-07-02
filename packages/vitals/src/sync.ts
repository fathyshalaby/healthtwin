import type { Sample } from "./types";
import type { SampleStore } from "./store";

export type SampleCursor = string | undefined;

export interface SamplePullPage {
  records: Sample[];
  cursor: SampleCursor;
}

/**
 * A backend the sample sync engine can talk to. Samples are append-only and
 * id-keyed, so push/pull are idempotent — no merge/conflict logic required.
 * Mirrors @healthtwin/core's SyncAdapter for the vitals stream.
 */
export interface SampleSyncAdapter {
  push(records: Sample[]): Promise<{ acked: string[] }>;
  pull(cursor?: SampleCursor): Promise<SamplePullPage>;
}

/** Per-device sync bookkeeping: the pull cursor and which sample ids are known-synced. */
export interface SampleSyncMeta {
  getCursor(): Promise<SampleCursor>;
  setCursor(c: SampleCursor): Promise<void>;
  syncedIds(): Promise<Set<string>>;
  markSynced(ids: string[]): Promise<void>;
}

export interface SampleSyncResult {
  pushed: number;
  pulled: number;
}

/**
 * One sync pass: push local samples the backend hasn't acked, then pull remote
 * samples since the cursor and append any not already present. Idempotent.
 */
export async function runSampleSync(
  store: SampleStore,
  meta: SampleSyncMeta,
  adapter: SampleSyncAdapter,
): Promise<SampleSyncResult> {
  const local = await store.all();
  const synced = await meta.syncedIds();

  const toPush = local.filter((s) => !synced.has(s.id));
  if (toPush.length > 0) {
    const { acked } = await adapter.push(toPush);
    await meta.markSynced(acked);
  }

  const cursor = await meta.getCursor();
  const page = await adapter.pull(cursor);
  const existing = new Set(local.map((s) => s.id));
  const incoming = page.records.filter((r) => !existing.has(r.id));
  for (const r of incoming) await store.append(r);
  if (page.records.length > 0) await meta.markSynced(page.records.map((r) => r.id));
  await meta.setCursor(page.cursor);

  return { pushed: toPush.length, pulled: incoming.length };
}

export function createMemorySampleSyncMeta(): SampleSyncMeta {
  let cursor: SampleCursor = undefined;
  const synced = new Set<string>();
  return {
    async getCursor() { return cursor; },
    async setCursor(c) { cursor = c; },
    async syncedIds() { return new Set(synced); },
    async markSynced(ids) { for (const id of ids) synced.add(id); },
  };
}
