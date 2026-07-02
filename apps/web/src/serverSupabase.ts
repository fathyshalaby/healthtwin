import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createCloudAdapter } from "@healthtwin/supabase";
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
