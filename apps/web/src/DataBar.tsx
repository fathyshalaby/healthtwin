"use client";
import * as React from "react";
import Link from "next/link";
import { Download, FileText } from "lucide-react";
import { useObservations } from "@healthtwin/react";
import { getCloudConfig } from "./cloud";
import { buildTwinExport, downloadJson, exportFilename } from "./twinExport";
import { Button } from "@/components/ui/button";

export function DataBar() {
  const { observations } = useObservations();
  const cloud = React.useMemo(() => getCloudConfig() != null, []);

  const exportTwin = () => {
    downloadJson(
      exportFilename(),
      buildTwinExport({ observations, cloud, subjectHint: cloud ? "cloud-user" : "this-browser" }),
    );
  };

  return (
    <div
      className="data-bar mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card px-4 py-3 text-sm shadow-xs"
      data-testid="data-bar"
    >
      <p className="m-0 flex flex-wrap items-center gap-2 text-muted-foreground">
        <span className="data-dot" aria-hidden />
        {cloud ? (
          <>Saved to your HealthTwin cloud, with a local copy in this browser.</>
        ) : (
          <>
            Autosaved in <b className="font-semibold text-foreground">this browser</b> (IndexedDB). Nothing is uploaded until you turn on cloud or export a file.
          </>
        )}
        <span className="font-mono text-xs tracking-wide text-primary">
          {observations.length} live {observations.length === 1 ? "entry" : "entries"}
        </span>
      </p>
      <div className="data-bar-actions no-print flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" onClick={exportTwin} data-testid="export-json">
          <Download />
          Download JSON
        </Button>
        <Button size="sm" asChild>
          <Link href="/report">
            <FileText />
            Clinician report
          </Link>
        </Button>
      </div>
    </div>
  );
}
