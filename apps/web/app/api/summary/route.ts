import { NextResponse } from "next/server";
import { summarize, templateNarrator } from "@healthtwin/insights";
import { bearer, clientFor, pullAll } from "../../../src/serverSupabase";

// GET /api/summary?subject=<uid> — clinician view of a patient who granted access.
// RLS only returns rows the caller may read; we then scope to the named subject.
export async function GET(req: Request) {
  const token = bearer(req);
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
  return NextResponse.json({ subject, summary, narrative });
}
