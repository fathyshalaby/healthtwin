"use client";
import * as React from "react";
import { cohortSummary } from "@healthtwin/insights";
import { demoCohort } from "../../src/cohortDemo";

export default function PartnerPage() {
  const summary = React.useMemo(
    () => cohortSummary(demoCohort(42), { now: "2026-07-03T12:00:00.000Z", activeWindowDays: 30 }),
    [],
  );

  const regionMax = Math.max(...summary.topRegions.map((r) => r.count), 1);
  const types = Object.entries(summary.byType).sort((a, b) => b[1] - a[1]);
  const typeMax = Math.max(...types.map(([, c]) => c), 1);
  const activePct = summary.users ? Math.round((summary.activeUsers / summary.users) * 100) : 0;

  return (
    <>
      <div className="page-head">
        <span className="eyebrow">Partner · cohort analytics</span>
        <h1>Your cohort this month</h1>
        <p className="lede">
          Tenant-scoped aggregates from <code>@healthtwin/insights</code> — individual records stay
          row-level isolated; you see only the shape of the whole.
          <span className="demo-note">demo · synthetic cohort</span>
        </p>
      </div>

      <div className="kpi-grid">
        <div className="kpi"><span className="kpi-val">{summary.users}</span><span className="kpi-label">Members</span></div>
        <div className="kpi"><span className="kpi-val">{summary.activeUsers}</span><span className="kpi-label">Active 30d · {activePct}%</span></div>
        <div className="kpi"><span className="kpi-val">{summary.totalEntries}</span><span className="kpi-label">Entries logged</span></div>
        <div className="kpi"><span className="kpi-val">{summary.meanEntriesPerUser.toFixed(1)}</span><span className="kpi-label">Avg / member</span></div>
      </div>

      <section className="card" aria-label="Top regions">
        <h2>Where it hurts, across the cohort</h2>
        <div className="barchart">
          {summary.topRegions.map((r) => (
            <div className="bar-row" key={r.regionId + r.side}>
              <span className="bar-label">{r.label}</span>
              <span className="bar-track"><span className="bar-fill" style={{ width: `${(r.count / regionMax) * 100}%` }} /></span>
              <span className="bar-val">{r.count}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="card" aria-label="By symptom type">
        <h2>By symptom type</h2>
        <div className="barchart">
          {types.map(([t, c]) => (
            <div className="bar-row" key={t}>
              <span className="bar-label">{t}</span>
              <span className="bar-track"><span className="bar-fill alt" style={{ width: `${(c / typeMax) * 100}%` }} /></span>
              <span className="bar-val">{c}</span>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
