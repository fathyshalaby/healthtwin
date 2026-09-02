"use client";
import * as React from "react";
import { useObservations } from "@healthtwin/react";
import { getCloudConfig } from "./cloud";
import { buildTwinExport, downloadJson, exportFilename } from "./twinExport";

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
    <div className="data-bar" data-testid="data-bar">
      <p className="data-bar-copy">
        <span className="data-dot" aria-hidden />
        {cloud ? (
          <>Saved to your HealthTwin cloud, with a local copy in this browser.</>
        ) : (
          <>
            Autosaved in <b>this browser</b> (IndexedDB). Nothing is uploaded until you turn on cloud or export a file.
          </>
        )}
        <span className="data-count">{observations.length} live {observations.length === 1 ? "entry" : "entries"}</span>
      </p>
      <div className="data-bar-actions no-print">
        <button type="button" className="btn btn-ghost btn-sm" onClick={exportTwin} data-testid="export-json">
          Download JSON
        </button>
        <a className="btn btn-primary btn-sm" href="/report">Clinician report</a>
      </div>
    </div>
  );
}
