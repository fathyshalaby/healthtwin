import type { SupabaseClient } from "@supabase/supabase-js";
import type { SampleSyncAdapter, SamplePullPage, SampleCursor } from "@healthtwin/vitals";
import { toSampleRow, fromSampleRow, type SampleRow } from "@healthtwin/vitals";

const TABLE = "samples";
const PAGE = 500;

/**
 * SampleSyncAdapter over Supabase for the vitals stream. The `client` must
 * already be authenticated; RLS scopes all reads/writes to the current user.
 * Mirrors createCloudAdapter for observations.
 */
export function createSampleCloudAdapter(client: SupabaseClient): SampleSyncAdapter {
  return {
    async push(records) {
      if (records.length === 0) return { acked: [] };
      const { error } = await client
        .from(TABLE)
        .upsert(records.map(toSampleRow), { onConflict: "id", ignoreDuplicates: true })
        .select("id");
      if (error) throw new Error(error.message);
      // Append-only upsert: every input id is now present server-side.
      return { acked: records.map((r) => r.id) };
    },

    async pull(cursor?: SampleCursor): Promise<SamplePullPage> {
      const from = cursor ? Number(cursor) : 0;
      const { data, error } = await client
        .from(TABLE)
        .select("*")
        .gt("seq", from)
        .order("seq", { ascending: true })
        .limit(PAGE);
      if (error) throw new Error(error.message);
      const rows = (data ?? []) as SampleRow[];
      const records = rows.map(fromSampleRow);
      const nextCursor = rows.length ? String(rows[rows.length - 1].seq) : cursor;
      return { records, cursor: nextCursor };
    },
  };
}
