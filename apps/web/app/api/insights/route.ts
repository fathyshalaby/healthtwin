import { NextResponse } from "next/server";
import { summarize, templateNarrator } from "@healthtwin/insights";
import { bearer, clientFor, pullAll } from "../../../src/serverSupabase";

// GET /api/insights?from=ISO&to=ISO — processed summary of the caller's own twin.
export async function GET(req: Request) {
  const token = bearer(req);
  if (!token) return NextResponse.json({ error: "missing bearer token" }, { status: 401 });
  const client = clientFor(token);
  if (!client) return NextResponse.json({ error: "cloud not configured" }, { status: 501 });

  const params = new URL(req.url).searchParams;
  const observations = await pullAll(client);
  const summary = summarize(observations, {
    from: params.get("from") ?? undefined,
    to: params.get("to") ?? undefined,
  });
  // Use Claude for the narrative when configured; else the deterministic template.
  const narrator = process.env.ANTHROPIC_API_KEY
    ? (await import("@healthtwin/insights/anthropic")).anthropicNarrator()
    : templateNarrator();
  const narrative = await narrator.narrate(summary);
  return NextResponse.json({ summary, narrative });
}
