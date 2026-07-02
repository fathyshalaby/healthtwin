import { NextResponse } from "next/server";
import { bearer, clientFor, pullAll } from "../../../src/serverSupabase";
import { rateKey, rateLimited } from "../../../src/ratelimit";

// GET /api/export — GDPR portability: the caller's full observation history as JSON.
export async function GET(req: Request) {
  const token = bearer(req);
  const limited = await rateLimited(rateKey(req, token));
  if (limited) return limited;
  if (!token) return NextResponse.json({ error: "missing bearer token" }, { status: 401 });
  const client = clientFor(token);
  if (!client) return NextResponse.json({ error: "cloud not configured" }, { status: 501 });

  const observations = await pullAll(client);
  return NextResponse.json(
    { exportedAt: null, count: observations.length, observations },
    { headers: { "content-disposition": 'attachment; filename="healthtwin-export.json"' } },
  );
}
