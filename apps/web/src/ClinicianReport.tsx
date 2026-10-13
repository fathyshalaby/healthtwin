"use client";
import * as React from "react";
import { BodyMapReview, Timeline, useObservations, useVitals, createIdbSampleStore, ViewToggle } from "@healthtwin/react";
import type { BodyView } from "@healthtwin/core";
import { regionTitle } from "./lib/regions";
import { summarize, templateNarrator } from "@healthtwin/insights";
import { buildTwinExport, downloadJson, exportFilename } from "./twinExport";
import { getCloudConfig } from "./cloud";
import { IntensityMeter } from "./IntensityMeter";
import { Kpi } from "@/components/Kpi";
import { Printer, Download, FileSearch } from "lucide-react";
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
      <div className="empty">
        <span className="empty-icon"><FileSearch className="size-5" aria-hidden /></span>
        <strong>No symptoms logged yet</strong>
        <span>Capture a few entries, then come back — this page turns them into a clinician-facing report you can print or hand over as JSON.</span>
      </div>
    );
  }

  const generated = new Date().toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });

  return (
    <article className="report" aria-label="Clinician report">
      <header className="report-mast">
        <div>
          <p className="eyebrow">Clinician report</p>
          <h2>Between-visit body record</h2>
          <p className="lede">
            Self-reported symptoms only. Not a diagnosis, not medical advice. Generated {generated} from data stored
            {cloud ? " in the signed-in HealthTwin account." : " locally in this browser (IndexedDB)."}
          </p>
        </div>
        <div className="report-actions no-print flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="lg" onClick={exportTwin} data-testid="report-export"><Download />Download JSON</Button>
          <Button type="button" size="lg" onClick={printReport}><Printer />Print / save PDF</Button>
        </div>
      </header>

      <section className="card" aria-label="Narrative">
        <h2>Summary for the clinician</h2>
        <p className="narrative">{narrative || "…"}</p>
      </section>

      <div className="kpi-grid">
        <Kpi animate={false} label="Entries" value={summary.total} />
        <Kpi animate={false} label="Regions" value={summary.activeRegions} tone="mint" />
        <Kpi animate={false} label="Day streak" value={summary.streakDays} tone="amber" />
        <Kpi animate={false} label="Flares ≥7" value={summary.flares.length} tone="heat" />
      </div>

      <div className="report-grid">
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
          <p className="muted mt-3">Worsening: {summary.worsening.map((w) => w.label).join(", ")}.</p>
        )}
      </section>

      <section className="plate report-map">
        <div className="stage-head">
          <ViewToggle view={view} onChange={setView} />
          <span className="chip-hint">Heatmap · frequency</span>
        </div>
        <BodyMapReview view={view} />
      </section>
      </div>

      <section className="card" aria-label="Chronology">
        <h2>Chronology</h2>
        <Timeline />
      </section>

      <section className="card" aria-label="Log">
        <h2>Full log</h2>
        <ul className="entry-list">
          {observations.map((o) => (
            <li key={o.id} className="entry" data-testid="report-entry" style={{ "--i": (o.intensity ?? 5) / 10 } as React.CSSProperties}>
              <div className="entry-body">
                <div className="entry-top">
                  <span className="entry-region">{regionTitle(o.location.regionId, o.location.side)}</span>
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
                {o.note && <p className="muted m-0">{o.note}</p>}
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
