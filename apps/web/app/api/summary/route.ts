import { NextResponse } from "next/server";
import { summarize, templateNarrator } from "@healthtwin/insights";
import { correlateSymptomWithMetric, latest } from "@healthtwin/vitals";
import { bearer, clientFor, pullAll, pullSamples } from "../../../src/serverSupabase";
import { rateKey, rateLimited } from "../../../src/ratelimit";

// GET /api/summary?subject=<uid> — clinician view of a patient who granted access.
// RLS only returns rows the caller may read; we then scope to the named subject.
export async function GET(req: Request) {
  const token = bearer(req);
  const limited = await rateLimited(rateKey(req, token));
  if (limited) return limited;
  if (!token) return NextResponse.json({ error: "missing bearer token" }, { status: 401 });
  const client = clientFor(token);
  if (!client) return NextResponse.json({ error: "cloud not configured" }, { status: 501 });

  const subject = new URL(req.url).searchParams.get("subject");
  if (!subject) return NextResponse.json({ error: "missing subject" }, { status: 400 });

  const observations = (await pullAll(client)).filter((o) => o.subjectId === subject);
  if (observations.length === 0) {
    return NextResponse.json({ error: "no data (or not shared with you)" }, { status: 404 });
  }
  const summary = summarize(observations);
  const narrative = await templateNarrator().narrate(summary);

  // Vitals overlay: latest readings + symptom↔metric correlations, ranked by |r|.
  let vitals:
    | { latest: Array<{ kind: string; value: number; unit: string; at: string }>; correlations: unknown[] }
    | undefined;
  let vitalsError: string | undefined;
  try {
    const samples = await pullSamples(client, subject);
    if (samples.length > 0) {
      const kinds = [...new Set(samples.map((s) => s.kind))];
      const correlations = kinds
        .map((k) => correlateSymptomWithMetric(observations, samples, k))
        .filter((c) => c.pearson !== null)
        .sort((a, b) => Math.abs(b.pearson as number) - Math.abs(a.pearson as number));
      const latestVitals = kinds.map((k) => {
        const l = latest(samples, k)!;
        return { kind: k, value: l.value, unit: l.unit, at: l.at };
      });
      vitals = { latest: latestVitals, correlations };
    }
  } catch (e) {
    // A missing samples table (pre-migration) is expected → stay silent. Any other
    // failure is surfaced so a clinician doesn't mistake it for "no vitals recorded".
    const msg = (e as Error).message ?? "";
    if (!/does not exist|relation|42P01/i.test(msg)) vitalsError = "vitals temporarily unavailable";
  }

  return NextResponse.json({ subject, summary, narrative, vitals, vitalsError });
}
