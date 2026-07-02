import * as React from "react";
import { BodyMap } from "@healthtwin/bodymap-react";
import { shadingFor } from "@healthtwin/bodymap-core";
import { computeHeatmap, type HeatmapMetric, type BodyView } from "@healthtwin/core";
import { useObservations } from "./useObservations";

const METRICS: HeatmapMetric[] = ["frequency", "meanIntensity", "recency"];

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

  const shading = React.useMemo(
    () => shadingFor(computeHeatmap(observations, { metric, from })),
    [observations, metric, from],
  );

  return (
    <div>
      <div role="radiogroup" aria-label="Heatmap metric">
        {METRICS.map((m) => (
          <label key={m}>
            <input type="radio" name="ht-metric" aria-label={m} checked={metric === m} onChange={() => setMetric(m)} /> {m}
          </label>
        ))}
      </div>
      <BodyMap
        view={view}
        shading={shading}
        onSelect={(s) => onRegionSelect?.(selectedRegionId === s.regionId ? null : s.regionId)}
      />
      <p aria-label="legend">Cooler = less · warmer = more</p>
    </div>
  );
};
