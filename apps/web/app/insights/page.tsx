"use client";
import * as React from "react";
import Link from "next/link";
import { ArrowRight, Sparkles, Wand2 } from "lucide-react";
import { useObservations, useVitals, createIdbSampleStore, CorrelationView } from "@healthtwin/react";
import { summarize, templateNarrator } from "@healthtwin/insights";
import { latest } from "@healthtwin/vitals";
import { buildDemoWeek } from "../../src/demo";
import { PageHeader } from "../../src/components/PageHeader";
import { Kpi } from "@/components/Kpi";
import { Rise, Sparkline } from "@/components/motion";
import { Button } from "@/components/ui/button";

const sampleStore = createIdbSampleStore();

export default function InsightsPage() {
  const { observations, add } = useObservations();
  const { samples, addSample, loading } = useVitals(sampleStore);
  const [narrative, setNarrative] = React.useState("");
  const [seeding, setSeeding] = React.useState(false);

  const summary = React.useMemo(() => (observations.length ? summarize(observations) : null), [observations]);
  React.useEffect(() => {
    let live = true;
    if (summary) void templateNarrator().narrate(summary).then((n) => { if (live) setNarrative(n); });
    else setNarrative("");
    return () => { live = false; };
  }, [summary]);

  const kinds = React.useMemo(() => [...new Set(samples.map((s) => s.kind))], [samples]);

  const seedDemoWeek = async () => {
    setSeeding(true);
    try {
      const demo = buildDemoWeek();
      for (let i = 0; i < demo.days.length; i++) {
        await add({
          location: { regionId: "knee", side: "left", view: "anterior" },
          type: "pain", intensity: demo.pain[i], occurredAt: `${demo.days[i]}T10:00:00.000Z`,
        });
        await addSample({ kind: "sleep_minutes", value: demo.sleepMin[i], unit: "min", at: `${demo.days[i]}T23:00:00.000Z` }, "local");
        await addSample({ kind: "steps", value: demo.steps[i], unit: "count", at: `${demo.days[i]}T20:00:00.000Z` }, "local");
      }
    } finally {
      setSeeding(false);
    }
  };

  const seedButton = (
    <Button type="button" variant={summary ? "outline" : "default"} size="lg" onClick={seedDemoWeek} disabled={seeding}>
      <Wand2 />
      {seeding ? "Seeding…" : "Seed a demo week"}
    </Button>
  );

  return (
    <>
      <PageHeader
        eyebrow="Insights"
        title="What moves the needle"
        actions={
          <>
            {seedButton}
            <span className="muted">a correlated week — short sleep, then knee flares.</span>
          </>
        }
      >
        The same engine that powers the cloud API — <code>@healthtwin/insights</code> +{" "}
        <code>@healthtwin/vitals</code> — runs right here, over records that never left this device.
      </PageHeader>

      {summary ? (
        <>
          <div className="kpi-grid">
            <Kpi label="Entries" value={summary.total} delay={0.04} />
            <Kpi label="Active regions" value={summary.activeRegions} tone="mint" delay={0.08} />
            <Kpi label="Day streak" value={summary.streakDays} tone="amber" sub="days in a row" delay={0.12} />
            <Kpi label="Flares ≥ 7" value={summary.flares.length} tone="heat" sub="high-intensity entries" delay={0.16} />
          </div>

          <Rise delay={0.18} as="section" className="card narrative-card">
            <div className="card-head">
              <h2 className="flex items-center gap-2"><Sparkles className="size-4 text-primary" aria-hidden /> Narrative</h2>
              <span className="chip-hint">on-device · no model</span>
            </div>
            <p className="narrative">{narrative || "…"}</p>
          </Rise>

          <Rise delay={0.22} as="section" className="card">
            <div className="card-head"><h2>Latest vitals</h2></div>
            {loading ? (
              <p className="muted">Loading…</p>
            ) : kinds.length === 0 ? (
              <p className="muted">No vitals yet — seed a demo week or ingest wearable data.</p>
            ) : (
              <div className="vital-grid">
                {kinds.map((k) => {
                  const l = latest(samples, k);
                  const trend = samples.filter((s) => s.kind === k).sort((a, b) => (a.at < b.at ? -1 : 1)).slice(-14).map((s) => s.value);
                  return l ? (
                    <div key={k} className="vital">
                      <span className="vital-name">{k.replace(/_/g, " ")}</span>
                      <span className="vital-val">{l.value.toLocaleString()}<small>{l.unit}</small></span>
                      <Sparkline values={trend} tone="var(--cool)" />
                    </div>
                  ) : null;
                })}
              </div>
            )}
          </Rise>

          <Rise delay={0.26} as="section" className="card">
            <div className="card-head"><h2>Symptom × vitals correlation</h2></div>
            {kinds.length === 0 ? (
              <p className="muted">Add vitals to see how they track your symptoms.</p>
            ) : (
              kinds.map((k) => (
                <CorrelationView key={k} observations={observations} samples={samples} kind={k} />
              ))
            )}
          </Rise>
        </>
      ) : (
        <Rise className="empty">
          <span className="empty-icon"><Sparkles className="size-5" aria-hidden /></span>
          <strong>No symptoms logged yet</strong>
          <span>Capture a few entries — or seed a demo week — to see insights.</span>
          <Button asChild variant="outline" size="sm" className="mt-2">
            <Link href="/">Go to Capture <ArrowRight /></Link>
          </Button>
        </Rise>
      )}
    </>
  );
}
