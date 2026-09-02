"use client";
import { ClinicianReport } from "../../src/ClinicianReport";

export default function ReportPage() {
  return (
    <>
      <div className="page-head no-print">
        <span className="eyebrow">Report</span>
        <h1>Hand this to a clinician</h1>
        <p className="lede">
          A print-ready summary of the twin on this device. Download JSON to keep a copy, or print to PDF to attach to a chart.
          Sharing live access still needs cloud mode on the Share tab.
        </p>
      </div>
      <ClinicianReport />
    </>
  );
}
