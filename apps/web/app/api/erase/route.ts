import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { bearer, clientFor } from "../../../src/serverSupabase";
import { rateKey, rateLimited } from "../../../src/ratelimit";

// POST /api/erase — GDPR Art. 17 erasure: hard-purge the caller's own data.
// Uses the service role to run purge_subject (migration 0006) for the authed user only.
export async function POST(req: Request) {
  const token = bearer(req);
  const limited = await rateLimited(rateKey(req, token));
  if (limited) return limited;
  if (!token) return NextResponse.json({ error: "missing bearer token" }, { status: 401 });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const client = clientFor(token);
  if (!url || !service || !client) return NextResponse.json({ error: "erasure not configured" }, { status: 501 });

  const { data } = await client.auth.getUser();
  const uid = data.user?.id;
  if (!uid) return NextResponse.json({ error: "invalid session" }, { status: 401 });

  const admin = createClient(url, service, { auth: { persistSession: false } });
  const { error } = await admin.rpc("purge_subject", { target: uid });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ erased: uid });
}
