"use client";
import * as React from "react";
import { useObservations } from "@healthtwin/react";
import { getRegion } from "@healthtwin/core";

export function EntriesList() {
  const { observations } = useObservations();
  return (
    <section aria-label="Logged entries">
      <h2>Entries ({observations.length})</h2>
      <ul>
        {observations.map((o) => (
          <li key={o.id} data-testid="entry">
            {getRegion(o.location.regionId)?.label ?? o.location.regionId} — {o.type}
            {o.intensity != null ? ` (${o.intensity}/10)` : ""}
          </li>
        ))}
      </ul>
    </section>
  );
}
