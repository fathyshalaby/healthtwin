import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createCloudAdapter } from "@healthtwin/supabase";
import { fromSampleRow, type Sample, type SampleRow } from "@healthtwin/vitals";
import type { Observation } from "@healthtwin/core";

/** Extract the bearer access token from an API request. */
export function bearer(req: Request): string | null {
  const h = req.headers.get("authorization") ?? "";
  return h.startsWith("Bearer ") ? h.slice(7) : null;
}

/** A Supabase client acting as the token's user, so RLS applies. Null if cloud is unconfigured. */
export function clientFor(token: string): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return null;
  return createClient(url, anon, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false },
  });
}

/** Pull every observation the client is allowed to read (RLS-scoped), paged. */
export async function pullAll(client: SupabaseClient): Promise<Observation[]> {
  const adapter = createCloudAdapter(client);
  const all: Observation[] = [];
  let cursor: string | undefined;
  for (let i = 0; i < 200; i++) {
    const page = await adapter.pull(cursor);
    all.push(...page.records);
    if (page.records.length === 0 || page.cursor === cursor) break;
    cursor = page.cursor;
  }
  return all;
}

/**
 * Pull vitals samples the client is allowed to read (RLS-scoped), paged by the
 * server-assigned `seq` cursor so nothing is silently truncated. Pass `subjectId`
 * to scope server-side (avoids fetching other patients' rows for a clinician view).
 */
export async function pullSamples(client: SupabaseClient, subjectId?: string): Promise<Sample[]> {
  const all: Sample[] = [];
  let from = 0;
  for (let i = 0; i < 1000; i++) {
    let q = client.from("samples").select("*").gt("seq", from);
    if (subjectId) q = q.eq("subject_id", subjectId);
    const { data, error } = await q.order("seq", { ascending: true }).limit(500);
    if (error) throw new Error(error.message);
    const rows = (data ?? []) as SampleRow[];
    if (rows.length === 0) break;
    for (const r of rows) all.push(fromSampleRow(r));
    const lastSeq = rows[rows.length - 1].seq;
    if (lastSeq == null || rows.length < 500) break;
    from = lastSeq;
  }
  return all;
}
