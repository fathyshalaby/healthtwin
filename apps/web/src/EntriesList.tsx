"use client";
import * as React from "react";
import { useObservations, EntrySheet } from "@healthtwin/react";
import { getRegion, type Observation } from "@healthtwin/core";
import { IntensityMeter } from "./IntensityMeter";

function relTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3.6e6);
  if (h < 1) return "just now";
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function EntriesList() {
  const { observations, edit, remove } = useObservations();
  const [editing, setEditing] = React.useState<Observation | null>(null);

  return (
    <section className="entries" aria-label="Logged entries">
      <div className="entries-head">
        <h2>Entries</h2>
        <span className="count">{observations.length}</span>
      </div>

      {observations.length === 0 ? (
        <p className="empty">No entries yet. Tap a region on the body map to log the first one.</p>
      ) : (
        <ul className="entry-list">
          {observations.map((o) => (
            <li key={o.id} data-testid="entry" className="entry">
              <div className="entry-body">
                <div className="entry-top">
                  <span className="entry-region">{getRegion(o.location.regionId)?.label ?? o.location.regionId}</span>
                  <span className="entry-tags">
                    <span className="tag tag-type">{o.type}</span>
                    {(o.quality ?? []).map((q) => <span key={q} className="tag">{q}</span>)}
                  </span>
                </div>
                <div className="entry-meta">
                  {o.intensity != null && <IntensityMeter value={o.intensity} />}
                  <span className="entry-time">{relTime(o.occurredAt)}</span>
                </div>
              </div>
              <div className="entry-actions">
                <button type="button" className="icon-btn" onClick={() => setEditing(o)}>Edit</button>
                <button type="button" className="icon-btn danger" onClick={() => remove(o)}>Delete</button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {editing && (
        <div className="sheet-backdrop" onClick={() => setEditing(null)}>
          <div className="sheet" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <EntrySheet
              regionId={editing.location.regionId}
              regionLabel={getRegion(editing.location.regionId)?.label ?? editing.location.regionId}
              side={editing.location.side}
              view={editing.location.view}
              point={editing.location.point}
              initial={{
                type: editing.type, quality: editing.quality, intensity: editing.intensity,
                note: editing.note, contextTags: editing.contextTags, occurredAt: editing.occurredAt,
              }}
              onSubmit={async (patch) => { await edit(editing, patch); setEditing(null); }}
              onCancel={() => setEditing(null)}
            />
          </div>
        </div>
      )}
    </section>
  );
}
