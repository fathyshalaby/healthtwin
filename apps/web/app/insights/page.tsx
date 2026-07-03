"use client";
import * as React from "react";
import Link from "next/link";
import { useObservations, useVitals, createIdbSampleStore, CorrelationView } from "@healthtwin/react";
import { summarize, templateNarrator } from "@healthtwin/insights";
import { latest } from "@healthtwin/vitals";

const sampleStore = createIdbSampleStore();

// A correlated demo week: the nights with the least sleep precede the worst knee flares.
const DEMO = {
  days: ["2026-06-26", "2026-06-27", "2026-06-28", "2026-06-29", "2026-06-30", "2026-07-01", "2026-07-02"],
  pain: [2, 3, 6, 7, 5, 8, 3],
  sleepMin: [450, 435, 330, 300, 360, 270, 450],
  steps: [8200, 7600, 5100, 4300, 6000, 3800, 9000],
};

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
      for (let i = 0; i < DEMO.days.length; i++) {
        await add({
          location: { regionId: "knee", side: "left", view: "anterior" },
          type: "pain", intensity: DEMO.pain[i], occurredAt: `${DEMO.days[i]}T10:00:00.000Z`,
        });
        await addSample({ kind: "sleep_minutes", value: DEMO.sleepMin[i], unit: "min", at: `${DEMO.days[i]}T23:00:00.000Z` }, "local");
        await addSample({ kind: "steps", value: DEMO.steps[i], unit: "count", at: `${DEMO.days[i]}T20:00:00.000Z` }, "local");
      }
    } finally {
      setSeeding(false);
    }
  };

  return (
    <main>
      <h1>Insights</h1>
      <nav>
        <Link href="/">← Capture</Link>
        <Link href="/review">Review</Link>
      </nav>

      <p className="muted">
        Runs entirely on this device — the same pure engine (<code>@healthtwin/insights</code> +{" "}
        <code>@healthtwin/vitals</code>) that powers the cloud API, over your local records.
      </p>

      <p style={{ margin: "12px 0" }}>
        <button type="button" className="ht-btn ht-btn-primary" onClick={seedDemoWeek} disabled={seeding}>
          {seeding ? "Seeding…" : "Seed a demo week"}
        </button>{" "}
        <span className="muted">a correlated week (short sleep → knee flares) to try it out.</span>
      </p>

      {summary ? (
        <>
          <section className="card" aria-label="Narrative">
            <h2>Narrative</h2>
            <p className="narrative">{narrative || "…"}</p>
          </section>

          <section className="card" aria-label="Latest vitals">
            <h2>Latest vitals</h2>
            {loading ? (
              <p className="muted">Loading…</p>
            ) : kinds.length === 0 ? (
              <p className="muted">No vitals yet — seed a demo week or ingest wearable data.</p>
            ) : (
              <div className="vital-chips">
                {kinds.map((k) => {
                  const l = latest(samples, k);
                  return l ? (
                    <span key={k} className="vital-chip">{k.replace(/_/g, " ")}: {l.value} {l.unit}</span>
                  ) : null;
                })}
              </div>
            )}
          </section>

          <section className="card" aria-label="Correlations">
            <h2>Symptom × vitals correlation</h2>
            {kinds.length === 0 ? (
              <p className="muted">Add vitals to see how they track your symptoms.</p>
            ) : (
              kinds.map((k) => (
                <div key={k} style={{ marginBottom: 14 }}>
                  <CorrelationView observations={observations} samples={samples} kind={k} />
                </div>
              ))
            )}
          </section>
        </>
      ) : (
        <p className="muted">No symptoms logged yet — capture a few entries (or seed a demo week) to see insights.</p>
      )}
    </main>
  );
}
