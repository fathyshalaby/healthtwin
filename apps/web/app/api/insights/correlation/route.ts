import { NextResponse } from "next/server";
import { correlateSymptomWithMetric, SAMPLE_KINDS, type SampleKind } from "@healthtwin/vitals";
import { bearer, clientFor, pullAll, pullSamples } from "../../../../src/serverSupabase";
import { rateKey, rateLimited } from "../../../../src/ratelimit";

// GET /api/insights/correlation?kind=sleep_minutes — Pearson of daily symptom
// intensity vs. a wearable metric ("flare-ups vs. poor sleep").
export async function GET(req: Request) {
  const token = bearer(req);
  const limited = await rateLimited(rateKey(req, token));
  if (limited) return limited;
  if (!token) return NextResponse.json({ error: "missing bearer token" }, { status: 401 });

  const client = clientFor(token);
  if (!client) return NextResponse.json({ error: "cloud not configured" }, { status: 501 });

  const kindParam = new URL(req.url).searchParams.get("kind");
  if (!kindParam || !SAMPLE_KINDS.includes(kindParam as SampleKind)) {
    return NextResponse.json({ error: "unknown or missing kind", kinds: SAMPLE_KINDS }, { status: 400 });
  }

  const [observations, samples] = await Promise.all([pullAll(client), pullSamples(client)]);
  return NextResponse.json({
    correlation: correlateSymptomWithMetric(observations, samples, kindParam as SampleKind),
  });
}
