"use client";
import { ClinicianReport } from "../../src/ClinicianReport";
import { PageHeader } from "../../src/components/PageHeader";

export default function ReportPage() {
  return (
    <>
      <PageHeader className="page-head no-print mb-6" eyebrow="Report" title="Hand this to a clinician">
        A print-ready summary of the twin on this device. Download JSON to keep a copy, or print to PDF to attach to a chart.
        Sharing live access still needs cloud mode on the Share tab.
      </PageHeader>
      <ClinicianReport />
    </>
  );
}
