"use client";
import * as React from "react";
import Link from "next/link";
import { Download, FileText } from "lucide-react";
import { useObservations } from "@healthtwin/react";
import { getCloudConfig } from "./cloud";
import { buildTwinExport, downloadJson, exportFilename } from "./twinExport";
import { CountUp } from "@/components/motion";
import { Button } from "@/components/ui/button";

export function DataBar() {
  const { observations } = useObservations();
  const cloud = React.useMemo(() => getCloudConfig() != null, []);

  const exportTwin = React.useCallback(() => {
    downloadJson(
      exportFilename(),
      buildTwinExport({ observations, cloud, subjectHint: cloud ? "cloud-user" : "this-browser" }),
    );
  }, [observations, cloud]);

  // The ⌘K palette triggers the same export through a window event (it lives outside the provider).
  React.useEffect(() => {
    window.addEventListener("ht:export", exportTwin);
    return () => window.removeEventListener("ht:export", exportTwin);
  }, [exportTwin]);

  return (
    <div className="data-bar" data-testid="data-bar">
      <p className="data-bar-copy">
        <span className="data-dot" aria-hidden />
        {cloud ? (
          <>Saved to your HealthTwin cloud, with a local copy in this browser.</>
        ) : (
          <>
            <span>Autosaved in <b>this browser</b></span>
            <span className="hidden md:inline">· nothing is uploaded unless you export or turn on cloud.</span>
          </>
        )}
        <span className="data-count">
          <CountUp value={observations.length} duration={0.5} /> live {observations.length === 1 ? "entry" : "entries"}
        </span>
      </p>
      <div className="data-bar-actions no-print">
        <Button type="button" variant="outline" size="sm" onClick={exportTwin} data-testid="export-json">
          <Download />
          <span className="max-md:sr-only">Download JSON</span>
        </Button>
        {/* the mobile dock already links to Report, so the phone bar keeps just the export icon */}
        <Button size="sm" asChild className="max-md:hidden">
          <Link href="/report">
            <FileText />
            Clinician report
          </Link>
        </Button>
      </div>
    </div>
  );
}
