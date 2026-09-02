import type { Observation } from "@healthtwin/core";
import type { Sample } from "@healthtwin/vitals";

export const TWIN_FORMAT = "healthtwin.twin.v1";

export interface TwinExport {
  format: typeof TWIN_FORMAT;
  exportedAt: string;
  store: "indexeddb" | "cloud";
  subjectHint: string;
  observations: Observation[];
  samples: Sample[];
}

export function buildTwinExport(input: {
  observations: Observation[];
  samples?: Sample[];
  cloud?: boolean;
  subjectHint?: string;
}): TwinExport {
  return {
    format: TWIN_FORMAT,
    exportedAt: new Date().toISOString(),
    store: input.cloud ? "cloud" : "indexeddb",
    subjectHint: input.subjectHint ?? "local-device",
    observations: input.observations,
    samples: input.samples ?? [],
  };
}

export function downloadJson(filename: string, data: unknown): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function exportFilename(prefix = "healthtwin"): string {
  return `${prefix}-${new Date().toISOString().slice(0, 10)}.json`;
}
