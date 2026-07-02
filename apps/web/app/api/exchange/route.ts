import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyPartnerToken } from "@healthtwin/supabase/partnerAuth";
import { rateKey, rateLimited } from "../../../src/ratelimit";

// Partner token → scoped HealthTwin session. Requires PARTNER_JWT_SECRET,
// SUPABASE_SERVICE_ROLE_KEY, and NEXT_PUBLIC_SUPABASE_URL (server-only secrets).
export async function POST(req: Request) {
  const limited = await rateLimited(rateKey(req, null));
  if (limited) return limited;
  const secret = process.env.PARTNER_JWT_SECRET;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret || !url || !serviceRole) {
    return NextResponse.json({ error: "exchange not configured" }, { status: 501 });
  }

  const { partnerToken } = (await req.json()) as { partnerToken?: string };
  if (!partnerToken) return NextResponse.json({ error: "missing partnerToken" }, { status: 400 });

  let claims;
  try {
    claims = verifyPartnerToken(partnerToken, secret);
  } catch {
    return NextResponse.json({ error: "invalid partner token" }, { status: 401 });
  }

  const admin = createClient(url, serviceRole);
  const email = `${claims.sub}@${claims.partnerId}.partner.healthtwin`;

  // Idempotently ensure the partner user exists, tagged with partner_id (surfaced as a JWT claim).
  const created = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    app_metadata: { partner_id: claims.partnerId },
  });
  // A magic link the partner app completes to obtain a session for this user.
  const link = await admin.auth.admin.generateLink({ type: "magiclink", email });
  const subjectId = created.data.user?.id ?? link.data.user?.id ?? null;

  return NextResponse.json({ subjectId, actionLink: link.data.properties?.action_link ?? null });
}
