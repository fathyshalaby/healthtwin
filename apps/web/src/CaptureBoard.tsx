"use client";
import * as React from "react";
import { BodyMap, ViewToggle, EntrySheet, useObservations, type BodyMapSelection } from "@healthtwin/react";
import { getRegion, type BodyView } from "@healthtwin/core";

/** The capture experience: a diagnostic plate with the body figure and a modal entry sheet. */
export function CaptureBoard() {
  const { add } = useObservations();
  const [view, setView] = React.useState<BodyView>("anterior");
  const [sel, setSel] = React.useState<BodyMapSelection | null>(null);
  const close = () => setSel(null);

  return (
    <>
      <section className="plate" aria-label="Body map">
        <div className="plate-head">
          <span>{view === "anterior" ? "ANTERIOR" : "POSTERIOR"} · TODAY</span>
          <span className="chip-hint">tap where it hurts</span>
        </div>

        <ViewToggle view={view} onChange={(nv) => { setView(nv); close(); }} />

        <div className="figure">
          <BodyMap view={view} selectedKey={sel?.key} onSelect={setSel} />
        </div>
      </section>

      {sel && (
        <div className="sheet-backdrop" onClick={close}>
          <div className="sheet" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <EntrySheet
              regionId={sel.regionId}
              regionLabel={getRegion(sel.regionId)?.label ?? sel.regionId}
              side={sel.side}
              view={sel.view}
              point={sel.point}
              onSubmit={async (input) => { await add(input); close(); }}
              onCancel={close}
            />
          </div>
        </div>
      )}
    </>
  );
}
