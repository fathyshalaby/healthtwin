"use client";
import * as React from "react";
import { BodyMap, ViewToggle, EntrySheet, useObservations, type BodyMapSelection, type BodyMapHover } from "@healthtwin/react";
import type { BodyView } from "@healthtwin/core";
import { regionTitle } from "./lib/regions";
import dynamic from "next/dynamic";
import { Rise } from "@/components/motion";

// The sheet (and motion's drag engine) only downloads when something is first tapped.
const BottomSheet = dynamic(() => import("@/components/BottomSheet").then((m) => m.BottomSheet), { ssr: false });

/** The capture experience: a stage with the body figure, a live region readout, and a spring bottom sheet. */
export function CaptureBoard() {
  const { add } = useObservations();
  const [view, setView] = React.useState<BodyView>("anterior");
  const [sel, setSel] = React.useState<BodyMapSelection | null>(null);
  const [hover, setHover] = React.useState<BodyMapHover | null>(null);
  const close = () => setSel(null);

  // Keep rendering the last selection while the sheet animates out, so it never empties mid-exit.
  const last = React.useRef<BodyMapSelection | null>(null);
  if (sel) last.current = sel;
  const shown = sel ?? last.current;

  return (
    <Rise delay={0.05} className="stage-sticky">
      <section className="plate">
        <div className="stage-head">
          <ViewToggle view={view} onChange={(nv) => { setView(nv); setHover(null); close(); }} />
          <span className="chip-hint">{view === "anterior" ? "Anterior" : "Posterior"} view</span>
        </div>

        <div key={view} className="fade-in">
          <BodyMap view={view} selectedKey={sel?.key} onSelect={setSel} onHover={setHover} />
        </div>

        <p className="readout" data-active={hover ? "" : undefined} aria-live="off">
          <span className="dot" aria-hidden />
          {hover ? (
            <>
              <b>{hover.label}</b>
              <span>· tap to log</span>
            </>
          ) : (
            <span>Tap a region to log how it feels</span>
          )}
        </p>
      </section>

      <BottomSheet open={sel != null} onOpenChange={(open) => { if (!open) close(); }} title="Log a symptom">
        {shown && (
          <EntrySheet
            regionId={shown.regionId}
            regionLabel={regionTitle(shown.regionId, shown.side)}
            side={shown.side}
            view={shown.view}
            point={shown.point}
            onSubmit={async (input) => { await add(input); close(); }}
            onCancel={close}
          />
        )}
      </BottomSheet>
    </Rise>
  );
}
