import { NextResponse } from "next/server";
import {
  createSample, fromHealthKit, fromGoogleFit, toSampleRow,
  type NewSample, type HealthKitRecord, type GoogleFitPoint, type Sample,
} from "@healthtwin/vitals";
import { bearer, clientFor } from "../../../../src/serverSupabase";
import { rateKey, rateLimited } from "../../../../src/ratelimit";

const MAX_BATCH = 5000;

// POST /api/vitals/ingest — body: { source?: "healthkit" | "googlefit", records: [...] }.
// Maps wearable exports into samples and upserts them (RLS scopes to the caller).
export async function POST(req: Request) {
  const token = bearer(req);
  const limited = await rateLimited(rateKey(req, token));
  if (limited) return limited;
  if (!token) return NextResponse.json({ error: "missing bearer token" }, { status: 401 });

  const client = clientFor(token);
  if (!client) return NextResponse.json({ error: "cloud not configured" }, { status: 501 });

  const { data: userData } = await client.auth.getUser(token);
  const uid = userData.user?.id;
  if (!uid) return NextResponse.json({ error: "invalid session" }, { status: 401 });

  let payload: { source?: string; records?: unknown[] };
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  const records = Array.isArray(payload.records) ? payload.records : [];
  if (records.length > MAX_BATCH) {
    return NextResponse.json({ error: `too many records (max ${MAX_BATCH} per request)` }, { status: 413 });
  }
  const ctx = { subjectId: uid };

  let samples: Sample[];
  try {
    if (payload.source === "healthkit") samples = fromHealthKit(records as HealthKitRecord[], ctx);
    else if (payload.source === "googlefit") samples = fromGoogleFit(records as GoogleFitPoint[], ctx);
    else samples = (records as NewSample[]).map((r) => createSample(r, ctx));
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }

  if (samples.length === 0) return NextResponse.json({ ingested: 0 });

  const { error } = await client
    .from("samples")
    .upsert(samples.map(toSampleRow), { onConflict: "id", ignoreDuplicates: true });
  if (error) {
    console.error("vitals ingest upsert failed:", error.message);
    return NextResponse.json({ error: "ingest failed" }, { status: 500 });
  }

  return NextResponse.json({ ingested: samples.length });
}
