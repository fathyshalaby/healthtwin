"use client";
import * as React from "react";
import { BodyMapReview, Timeline, useObservations, useVitals, createIdbSampleStore, ViewToggle } from "@healthtwin/react";
import { getRegion, type BodyView } from "@healthtwin/core";
import { summarize, templateNarrator } from "@healthtwin/insights";
import { buildTwinExport, downloadJson, exportFilename } from "./twinExport";
import { getCloudConfig } from "./cloud";
import { IntensityMeter } from "./IntensityMeter";
import { Button } from "@/components/ui/button";

const sampleStore = createIdbSampleStore();

export function ClinicianReport() {
  const { observations } = useObservations();
  const { samples } = useVitals(sampleStore);
  const cloud = React.useMemo(() => getCloudConfig() != null, []);
  const [view, setView] = React.useState<BodyView>("anterior");
  const [narrative, setNarrative] = React.useState("");

  const summary = React.useMemo(() => (observations.length ? summarize(observations) : null), [observations]);

  React.useEffect(() => {
    let live = true;
    if (summary) void templateNarrator().narrate(summary).then((n) => { if (live) setNarrative(n); });
    else setNarrative("");
    return () => { live = false; };
  }, [summary]);

  const printReport = () => window.print();
  const exportTwin = () => {
    downloadJson(
      exportFilename("healthtwin-clinician"),
      buildTwinExport({ observations, samples, cloud, subjectHint: cloud ? "cloud-user" : "this-browser" }),
    );
  };

  if (!summary) {
    return (
      <p className="empty">
        No symptoms logged yet. Capture a few entries, then come back — this page turns them into a clinician-facing report you can print or hand over as JSON.
      </p>
    );
  }

  const generated = new Date().toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });

  return (
    <article className="report" aria-label="Clinician report">
      <header className="report-mast">
        <div>
          <p className="eyebrow">FIG · clinician report</p>
          <h1>Between-visit body record</h1>
          <p className="lede">
            Self-reported symptoms only. Not a diagnosis, not medical advice. Generated {generated} from data stored
            {cloud ? " in the signed-in HealthTwin account." : " locally in this browser (IndexedDB)."}
          </p>
        </div>
        <div className="report-actions no-print flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={exportTwin} data-testid="report-export">Download JSON</Button>
          <Button type="button" onClick={printReport}>Print / save PDF</Button>
        </div>
      </header>

      <section className="card" aria-label="Narrative">
        <h2>Summary for the clinician</h2>
        <p className="narrative">{narrative || "…"}</p>
      </section>

      <div className="kpi-grid report-kpis">
        <div className="kpi"><span className="kpi-val">{summary.total}</span><span className="kpi-label">Entries</span></div>
        <div className="kpi"><span className="kpi-val">{summary.activeRegions}</span><span className="kpi-label">Regions</span></div>
        <div className="kpi"><span className="kpi-val">{summary.streakDays}</span><span className="kpi-label">Day streak</span></div>
        <div className="kpi"><span className="kpi-val">{summary.flares.length}</span><span className="kpi-label">Flares ≥7</span></div>
      </div>

      <section className="card" aria-label="Where it hurts">
        <h2>Most reported regions</h2>
        <div className="barchart">
          {summary.topRegions.map((r) => (
            <div className="bar-row" key={r.regionId + r.side}>
              <span className="bar-label">{r.label}</span>
              <span className="bar-track"><span className="bar-fill" style={{ width: `${Math.min(100, (r.count / (summary.topRegions[0]?.count || 1)) * 100)}%` }} /></span>
              <span className="bar-val">{r.count}×{r.meanIntensity != null ? ` · ${r.meanIntensity.toFixed(1)}` : ""}</span>
            </div>
          ))}
        </div>
        {summary.worsening.length > 0 && (
          <p className="muted" style={{ marginTop: 12 }}>Worsening: {summary.worsening.map((w) => w.label).join(", ")}.</p>
        )}
      </section>

      <section className="plate report-map">
        <div className="plate-head">
          <span>Heatmap · 30 days of frequency</span>
          <span className="chip-hint">print both views if needed</span>
        </div>
        <ViewToggle view={view} onChange={setView} />
        <div className="figure">
          <BodyMapReview view={view} />
        </div>
      </section>

      <section className="card" aria-label="Timeline">
        <h2>Chronology</h2>
        <Timeline />
      </section>

      <section className="card" aria-label="Log">
        <h2>Full log</h2>
        <ul className="entry-list">
          {observations.map((o) => (
            <li key={o.id} className="entry" data-testid="report-entry">
              <div className="entry-body">
                <div className="entry-top">
                  <span className="entry-region">{getRegion(o.location.regionId)?.label ?? o.location.regionId}</span>
                  <span className="entry-tags">
                    <span className="tag tag-type">{o.type}</span>
                    <span className="tag">{o.location.side}</span>
                    <span className="tag">{o.location.view}</span>
                    {(o.quality ?? []).map((q) => <span key={q} className="tag">{q}</span>)}
                  </span>
                </div>
                <div className="entry-meta">
                  {o.intensity != null && <IntensityMeter value={o.intensity} />}
                  <span className="entry-time">{o.occurredAt.replace("T", " ").slice(0, 16)} UTC</span>
                </div>
                {o.note && <p className="muted" style={{ margin: 0 }}>{o.note}</p>}
              </div>
            </li>
          ))}
        </ul>
      </section>

      <footer className="report-foot">
        HealthTwin clinician report · {summary.total} entries · store: {cloud ? "cloud + IndexedDB" : "IndexedDB on this device"} · not for diagnosis.
      </footer>
    </article>
  );
}
