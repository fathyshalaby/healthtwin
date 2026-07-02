import type { SupabaseClient } from "@supabase/supabase-js";

const TABLE = "consent_grants";

export interface ConsentGrant {
  id: string;
  grantor: string;
  grantee: string;
  scope: string;          // "all" or a regionId
  expiresAt: string | null;
  revoked: boolean;
  createdAt: string;
}

interface GrantRow {
  id: string;
  grantor: string;
  grantee: string;
  scope: string;
  expires_at: string | null;
  revoked: boolean;
  created_at: string;
}

const fromRow = (r: GrantRow): ConsentGrant => ({
  id: r.id, grantor: r.grantor, grantee: r.grantee, scope: r.scope,
  expiresAt: r.expires_at, revoked: r.revoked, createdAt: r.created_at,
});

/** Grant a grantee read access (grantor defaults to auth.uid() server-side). */
export async function createGrant(
  client: SupabaseClient,
  input: { grantee: string; scope?: string; expiresAt?: string | null },
): Promise<void> {
  const { error } = await client.from(TABLE).insert({
    grantee: input.grantee,
    scope: input.scope ?? "all",
    expires_at: input.expiresAt ?? null,
  });
  if (error) throw new Error(error.message);
}

export async function listGrants(client: SupabaseClient): Promise<ConsentGrant[]> {
  const { data, error } = await client.from(TABLE).select("*").order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return ((data ?? []) as GrantRow[]).map(fromRow);
}

export async function revokeGrant(client: SupabaseClient, id: string): Promise<void> {
  const { error } = await client.from(TABLE).update({ revoked: true }).eq("id", id);
  if (error) throw new Error(error.message);
}
