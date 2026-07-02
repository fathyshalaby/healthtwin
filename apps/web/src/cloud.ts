import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createCloudAdapter } from "@healthtwin/supabase";
import { createIdbSyncMeta } from "@healthtwin/react";
import type { SyncAdapter, SyncMeta } from "@healthtwin/core";

export interface CloudConfig {
  client: SupabaseClient;
  adapter: SyncAdapter;
  syncMeta: SyncMeta;
}

/** Returns cloud sync config when Supabase env is present, else null (local-only). */
export function getCloudConfig(): CloudConfig | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  const client = createClient(url, key);
  return { client, adapter: createCloudAdapter(client), syncMeta: createIdbSyncMeta() };
}
