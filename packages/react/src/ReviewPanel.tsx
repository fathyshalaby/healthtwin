import * as React from "react";
import { getRegion, type BodyView } from "@healthtwin/core";
import { BodyMapReview } from "./BodyMapReview";
import { Timeline } from "./Timeline";
import { ViewToggle } from "./ViewToggle";

const RANGES: { label: string; days: number | null }[] = [
  { label: "7d", days: 7 },
  { label: "30d", days: 30 },
  { label: "All", days: null },
];

// Links the heatmap and the timeline: a body view, a date window, and a
// tap-a-region-to-filter interaction shared across both.
export const ReviewPanel: React.FC<{ initialView?: BodyView }> = ({ initialView = "anterior" }) => {
  const [view, setView] = React.useState<BodyView>(initialView);
  const [days, setDays] = React.useState<number | null>(30);
  const [regionId, setRegionId] = React.useState<string | null>(null);

  const from = days != null ? new Date(Date.now() - days * 86_400_000).toISOString() : undefined;

  return (
    <div>
      <ViewToggle view={view} onChange={setView} />
      <div role="radiogroup" aria-label="Date range">
        {RANGES.map((r) => (
          <label key={r.label}>
            <input type="radio" name="ht-range" aria-label={r.label} checked={days === r.days} onChange={() => setDays(r.days)} /> {r.label}
          </label>
        ))}
      </div>

      <BodyMapReview view={view} from={from} selectedRegionId={regionId} onRegionSelect={setRegionId} />

      {regionId && (
        <button type="button" onClick={() => setRegionId(null)}>
          Clear region filter: {getRegion(regionId)?.label ?? regionId}
        </button>
      )}

      <Timeline filter={{ regionId: regionId ?? undefined, from }} />
    </div>
  );
};
