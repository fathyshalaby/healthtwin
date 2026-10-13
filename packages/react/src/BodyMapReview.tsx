import * as React from "react";
import { BodyMap, type BodyMapHover } from "@healthtwin/bodymap-react";
import { shadingFor } from "@healthtwin/bodymap-core";
import { computeHeatmap, type HeatmapMetric, type BodyView } from "@healthtwin/core";
import { useObservations } from "./useObservations";

const METRICS: HeatmapMetric[] = ["frequency", "meanIntensity", "recency"];
const METRIC_LABELS: Record<HeatmapMetric, string> = {
  frequency: "Frequency",
  meanIntensity: "Mean intensity",
  recency: "Recency",
};

/** Human-readable value for one region under the current metric (what the colour means). */
function describe(metric: HeatmapMetric, value: number | undefined): string {
  if (value == null) return "no entries in this window";
  if (metric === "frequency") return `${value} ${value === 1 ? "entry" : "entries"}`;
  if (metric === "meanIntensity") return `${value.toFixed(1)}/10 average`;
  const days = Math.floor((Date.now() - value) / 86_400_000);
  return days <= 0 ? "last logged today" : `last logged ${days}d ago`;
}

export interface BodyMapReviewProps {
  view?: BodyView;
  from?: string;
  selectedRegionId?: string | null;
  onRegionSelect?: (regionId: string | null) => void;
}

export const BodyMapReview: React.FC<BodyMapReviewProps> = ({
  view = "anterior", from, selectedRegionId, onRegionSelect,
}) => {
  const { observations } = useObservations();
  const [metric, setMetric] = React.useState<HeatmapMetric>("frequency");
  const [hover, setHover] = React.useState<BodyMapHover | null>(null);

  const values = React.useMemo(
    () => computeHeatmap(observations, { metric, from }),
    [observations, metric, from],
  );
  const shading = React.useMemo(() => shadingFor(values), [values]);

  return (
    <div>
      <div role="radiogroup" aria-label="Heatmap metric">
        {METRICS.map((m) => (
          <label key={m}>
            <input type="radio" name="ht-metric" aria-label={m} checked={metric === m} onChange={() => setMetric(m)} /> {METRIC_LABELS[m]}
          </label>
        ))}
      </div>
      <BodyMap
        view={view}
        shading={shading}
        onHover={setHover}
        onSelect={(s) => onRegionSelect?.(selectedRegionId === s.regionId ? null : s.regionId)}
      />
      {/* Visual-only readout; the regions themselves are the accessible controls. */}
      <p className="ht-readout" aria-hidden="true" data-active={hover ? "" : undefined}>
        {hover ? (
          <>
            <b>{hover.label}</b>
            <span>{describe(metric, values.get(hover.key))}</span>
          </>
        ) : (
          <span>Hover or focus a region to read its value</span>
        )}
      </p>
      <div role="note" aria-label="legend" className="ht-legend">
        <span className="ht-legend-bar" aria-hidden="true" />
        <span className="ht-legend-text">Cooler = less · warmer = more</span>
      </div>
    </div>
  );
};
