"use client";
import * as React from "react";
import { cohortSummary } from "@healthtwin/insights";
import { demoCohort } from "../../src/cohortDemo";
import { PageHeader } from "../../src/components/PageHeader";
import { Kpi } from "@/components/Kpi";
import { Rise } from "@/components/motion";

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
      <PageHeader eyebrow="Partner · cohort analytics" title="Your cohort this month">
        Tenant-scoped aggregates from <code>@healthtwin/insights</code> — individual records stay
        row-level isolated; you see only the shape of the whole.
        <span className="demo-note">demo · synthetic cohort</span>
      </PageHeader>

      <div className="kpi-grid">
        <Kpi label="Members" value={summary.users} delay={0.04} />
        <Kpi label="Active 30d" value={summary.activeUsers} tone="mint" sub={`${activePct}% of members`} delay={0.08} />
        <Kpi label="Entries logged" value={summary.totalEntries} tone="amber" delay={0.12} />
        <Kpi label="Avg / member" value={summary.meanEntriesPerUser} decimals={1} tone="heat" delay={0.16} />
      </div>

      <div className="report-grid">
        <Rise delay={0.2} as="section" className="card" >
          <div className="card-head"><h2>Where it hurts, across the cohort</h2></div>
          <div className="barchart" aria-label="Top regions" role="group">
            {summary.topRegions.map((r) => (
              <div className="bar-row" key={r.regionId + r.side}>
                <span className="bar-label">{r.label}</span>
                <span className="bar-track"><span className="bar-fill" style={{ width: `${(r.count / regionMax) * 100}%` }} /></span>
                <span className="bar-val">{r.count}</span>
              </div>
            ))}
          </div>
        </Rise>

        <Rise delay={0.26} as="section" className="card">
          <div className="card-head"><h2>By symptom type</h2></div>
          <div className="barchart" aria-label="By symptom type" role="group">
            {types.map(([t, c]) => (
              <div className="bar-row" key={t}>
                <span className="bar-label">{t}</span>
                <span className="bar-track"><span className="bar-fill alt" style={{ width: `${(c / typeMax) * 100}%` }} /></span>
                <span className="bar-val">{c}</span>
              </div>
            ))}
          </div>
        </Rise>
      </div>
    </>
  );
}
