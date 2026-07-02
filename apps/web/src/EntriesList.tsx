"use client";
import * as React from "react";
import { useObservations, EntrySheet } from "@healthtwin/react";
import { getRegion, type Observation } from "@healthtwin/core";

export function EntriesList() {
  const { observations, edit, remove } = useObservations();
  const [editing, setEditing] = React.useState<Observation | null>(null);

  return (
    <section aria-label="Logged entries">
      <h2>Entries ({observations.length})</h2>
      <ul>
        {observations.map((o) => (
          <li key={o.id} data-testid="entry">
            {getRegion(o.location.regionId)?.label ?? o.location.regionId} — {o.type}
            {o.intensity != null ? ` (${o.intensity}/10)` : ""}{" "}
            <button type="button" onClick={() => setEditing(o)}>Edit</button>{" "}
            <button type="button" onClick={() => remove(o)}>Delete</button>
          </li>
        ))}
      </ul>

      {editing && (
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
      )}
    </section>
  );
}
