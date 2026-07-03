"use client";
import * as React from "react";
import { defineHealthTwinCapture } from "@healthtwin/embed";
import type { Observation } from "@healthtwin/core";

interface Ev { region: string; side: string; type: string; intensity?: number; }

export default function EmbedDemo() {
  const hostRef = React.useRef<HTMLDivElement>(null);
  const [events, setEvents] = React.useState<Ev[]>([]);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    defineHealthTwinCapture();
    setMounted(true);
    const host = hostRef.current;
    if (!host) return;
    const onObs = (e: Event) => {
      const o = (e as CustomEvent<Observation>).detail;
      setEvents((prev) => [
        { region: o.location.regionId, side: o.location.side, type: o.type, intensity: o.intensity },
        ...prev,
      ].slice(0, 8));
    };
    host.addEventListener("healthtwin:observation", onObs);
    return () => host.removeEventListener("healthtwin:observation", onObs);
  }, []);

  return (
    <>
      <div className="page-head">
        <span className="eyebrow">SDK · Embed</span>
        <h1>Drop it into any site</h1>
        <p className="lede">
          One custom element. Every capture fires a <code>healthtwin:observation</code> event — so a
          partner can keep the data in their own backend, no HealthTwin account required.
        </p>
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <pre className="code-oneline">{`<script type="module">
  import { defineHealthTwinCapture } from "@healthtwin/embed";
  defineHealthTwinCapture();
</script>

<health-twin-capture view="anterior" subject-id="u_123"></health-twin-capture>`}</pre>
      </div>

      <div className="embed-grid">
        <div className="embed-frame" ref={hostRef}>
          <div className="embed-frame-bar">
            <span className="dot" /><span className="dot" /><span className="dot" />
            <span style={{ marginLeft: 6 }}>partner-app.example</span>
          </div>
          <div className="embed-frame-body">
            {mounted && React.createElement("health-twin-capture", { view: "anterior", "subject-id": "demo-partner" })}
          </div>
        </div>

        <section className="card" aria-label="Events received">
          <h2>Events received <span className="count">{events.length}</span></h2>
          {events.length === 0 ? (
            <p className="muted">Tap a region in the widget, then Save — each capture arrives here as an event.</p>
          ) : (
            <ul className="ev-list">
              {events.map((e, i) => (
                <li className="ev" key={i}>
                  <span className="ev-region">{e.region} {e.side}</span>
                  <span className="ev-meta">{e.type}{e.intensity != null ? ` · ${e.intensity}/10` : ""}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
