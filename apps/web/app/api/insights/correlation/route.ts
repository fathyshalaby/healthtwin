import { NextResponse } from "next/server";
import { correlateSymptomWithMetric, SAMPLE_KINDS, type SampleKind } from "@healthtwin/vitals";
import { bearer, clientFor, pullAll, pullSamples } from "../../../../src/serverSupabase";
import { rateKey, rateLimited } from "../../../../src/ratelimit";

// GET /api/insights/correlation?kind=sleep_minutes[&subject=<uid>] — Pearson of daily
// symptom intensity vs. a wearable metric ("flare-ups vs. poor sleep"). Scoped to a
// single subject (defaults to the caller) so a grantee's patients aren't blended.
export async function GET(req: Request) {
  const token = bearer(req);
  const limited = await rateLimited(rateKey(req, token));
  if (limited) return limited;
  if (!token) return NextResponse.json({ error: "missing bearer token" }, { status: 401 });

  const client = clientFor(token);
  if (!client) return NextResponse.json({ error: "cloud not configured" }, { status: 501 });

  const url = new URL(req.url);
  const kindParam = url.searchParams.get("kind");
  if (!kindParam || !SAMPLE_KINDS.includes(kindParam as SampleKind)) {
    return NextResponse.json({ error: "unknown or missing kind", kinds: SAMPLE_KINDS }, { status: 400 });
  }

  const { data: userData } = await client.auth.getUser(token);
  const uid = userData.user?.id;
  if (!uid) return NextResponse.json({ error: "invalid session" }, { status: 401 });
  const subject = url.searchParams.get("subject") ?? uid;

  const [observations, samples] = await Promise.all([
    pullAll(client).then((rows) => rows.filter((o) => o.subjectId === subject)),
    pullSamples(client, subject),
  ]);
  return NextResponse.json({
    subject,
    correlation: correlateSymptomWithMetric(observations, samples, kindParam as SampleKind),
  });
}
