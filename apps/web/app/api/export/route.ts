import { NextResponse } from "next/server";
import { bearer, clientFor, pullAll } from "../../../src/serverSupabase";

// GET /api/export — GDPR portability: the caller's full observation history as JSON.
export async function GET(req: Request) {
  const token = bearer(req);
  if (!token) return NextResponse.json({ error: "missing bearer token" }, { status: 401 });
  const client = clientFor(token);
  if (!client) return NextResponse.json({ error: "cloud not configured" }, { status: 501 });

  const observations = await pullAll(client);
  return NextResponse.json(
    { exportedAt: null, count: observations.length, observations },
    { headers: { "content-disposition": 'attachment; filename="healthtwin-export.json"' } },
  );
}
