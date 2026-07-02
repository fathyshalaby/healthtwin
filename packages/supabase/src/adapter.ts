import type { SupabaseClient } from "@supabase/supabase-js";
import type { SyncAdapter, PullPage, Cursor, ULID } from "@healthtwin/core";
import { toRow, fromRow, type ObservationRow } from "./rowMapping";

const TABLE = "observations";
const PAGE = 500;

/**
 * Reference SyncAdapter over Supabase. The `client` must already be
 * authenticated; RLS scopes all reads/writes to the current user.
 */
export function createCloudAdapter(client: SupabaseClient): SyncAdapter {
  return {
    async push(records) {
      if (records.length === 0) return { acked: [] };
      const { error } = await client
        .from(TABLE)
        .upsert(records.map(toRow), { onConflict: "id", ignoreDuplicates: true })
        .select("id");
      if (error) throw new Error(error.message);
      // Immutable upsert: every input id is now present server-side.
      return { acked: records.map((r) => r.id) as ULID[] };
    },

    async pull(cursor?: Cursor): Promise<PullPage> {
      const from = cursor ? Number(cursor) : 0;
      const { data, error } = await client
        .from(TABLE)
        .select("*")
        .gt("seq", from)
        .order("seq", { ascending: true })
        .limit(PAGE);
      if (error) throw new Error(error.message);
      const rows = (data ?? []) as ObservationRow[];
      const records = rows.map(fromRow);
      const nextCursor = rows.length ? String(rows[rows.length - 1].seq) : cursor;
      return { records, cursor: nextCursor };
    },
  };
}
