import * as React from "react";
import { buildTimeline, getRegion } from "@healthtwin/core";
import { useObservations } from "./useObservations";

export const Timeline: React.FC = () => {
  const { observations } = useObservations();
  const days = React.useMemo(() => buildTimeline(observations), [observations]);

  return (
    <section aria-label="Timeline">
      {days.map((d) => (
        <div key={d.date}>
          <h3>{d.date}</h3>
          <ul>
            {d.items.map((o) => (
              <li key={o.id} data-testid="timeline-entry">
                {getRegion(o.location.regionId)?.label ?? o.location.regionId} — {o.type}
                {o.intensity != null ? ` (${o.intensity}/10)` : ""}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
};
