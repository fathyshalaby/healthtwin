import type { SupabaseClient } from "@supabase/supabase-js";

/** Send a passwordless email OTP / magic link. */
export async function signInWithEmailOtp(client: SupabaseClient, email: string): Promise<void> {
  const { error } = await client.auth.signInWithOtp({ email });
  if (error) throw new Error(error.message);
}

/** The authenticated user's id, or null if signed out. Use this as the subjectId when syncing. */
export async function currentUserId(client: SupabaseClient): Promise<string | null> {
  const { data } = await client.auth.getUser();
  return data.user?.id ?? null;
}

export async function signOut(client: SupabaseClient): Promise<void> {
  const { error } = await client.auth.signOut();
  if (error) throw new Error(error.message);
}
