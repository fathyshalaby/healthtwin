import * as React from "react";
import { buildTimeline, getRegion, type ObservationFilter } from "@healthtwin/core";
import { useObservations } from "./useObservations";

/** "Left " / "Right " / "" — so a Timeline row never hides which side it was. */
const sidePrefix = (side: string) => (side === "left" ? "Left " : side === "right" ? "Right " : "");

function clock(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

export const Timeline: React.FC<{ filter?: ObservationFilter }> = ({ filter }) => {
  const { observations } = useObservations();
  const days = React.useMemo(() => buildTimeline(observations, filter), [observations, filter]);

  return (
    <section aria-label="Timeline">
      {days.length === 0 && <p className="ht-empty">No entries in this window yet.</p>}
      {days.map((d) => (
        <div key={d.date}>
          <h3>{d.date}</h3>
          <ul>
            {d.items.map((o) => (
              <li
                key={o.id}
                data-testid="timeline-entry"
                // 0–1 intensity drives the marker colour from the host's heat scale.
                style={o.intensity != null ? ({ "--ht-i": o.intensity / 10 } as React.CSSProperties) : undefined}
              >
                <span className="tl-dot" aria-hidden="true" />
                <span className="tl-main">
                  {sidePrefix(o.location.side)}{getRegion(o.location.regionId)?.label ?? o.location.regionId} — {o.type}
                </span>
                {o.intensity != null && <span className="tl-int">{o.intensity}/10</span>}
                <time className="tl-time" dateTime={o.occurredAt}>{clock(o.occurredAt)}</time>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
};
