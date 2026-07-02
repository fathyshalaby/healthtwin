import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyPartnerToken } from "@healthtwin/supabase/partnerAuth";
import { fromRow, type ObservationRow } from "@healthtwin/supabase";
import { cohortSummary } from "@healthtwin/insights";
import { bearer } from "../../../../src/serverSupabase";
import { rateKey, rateLimited } from "../../../../src/ratelimit";

// GET /api/partner/analytics — partner-scoped cohort analytics. Auth: a partner token.
// Reads with the service role (RLS is per-user) but strictly filters to the partner's id.
export async function GET(req: Request) {
  const token = bearer(req);
  const limited = await rateLimited(rateKey(req, token));
  if (limited) return limited;
  if (!token) return NextResponse.json({ error: "missing partner token" }, { status: 401 });

  const secret = process.env.PARTNER_JWT_SECRET;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret || !url || !service) return NextResponse.json({ error: "not configured" }, { status: 501 });

  let claims;
  try {
    claims = verifyPartnerToken(token, secret);
  } catch {
    return NextResponse.json({ error: "invalid partner token" }, { status: 401 });
  }

  const admin = createClient(url, service, { auth: { persistSession: false } });
  const { data, error } = await admin
    .from("observations")
    .select("*")
    .eq("partner_id", claims.partnerId)
    .limit(10_000);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const observations = ((data ?? []) as ObservationRow[]).map(fromRow);
  return NextResponse.json({ partnerId: claims.partnerId, analytics: cohortSummary(observations) });
}
