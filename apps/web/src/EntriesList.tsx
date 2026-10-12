"use client";
import * as React from "react";
import { Pencil, ScanLine, Trash2 } from "lucide-react";
import { useObservations, EntrySheet } from "@healthtwin/react";
import type { Observation } from "@healthtwin/core";
import { regionTitle } from "./lib/regions";
import { describeEntry, useAnnounce } from "@/components/Announcer";
import { IntensityMeter } from "./IntensityMeter";
import dynamic from "next/dynamic";
import { Rise } from "@/components/motion";
import { Button } from "@/components/ui/button";

// The sheet (and motion's drag engine) only downloads when something is first tapped.
const BottomSheet = dynamic(() => import("@/components/BottomSheet").then((m) => m.BottomSheet), { ssr: false });

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
  // Deleting plays a short collapse first, then actually removes the record.
  const [leaving, setLeaving] = React.useState<ReadonlySet<string>>(new Set());
  const announce = useAnnounce();
  const headingRef = React.useRef<HTMLHeadingElement>(null);
  const onDelete = (o: Observation) => {
    setLeaving((cur) => new Set(cur).add(o.id));
    // The focused Delete button is about to disappear — move focus to the list heading, not <body>.
    headingRef.current?.focus();
    window.setTimeout(() => {
      void remove(o).then(() => {
        const left = observations.length - 1;
        announce(`Deleted ${regionTitle(o.location.regionId, o.location.side)} entry. ${left} ${left === 1 ? "entry" : "entries"} left.`);
      });
    }, 240);
  };

  const last = React.useRef<Observation | null>(null);
  if (editing) last.current = editing;
  const shown = editing ?? last.current;

  return (
    <Rise delay={0.12} as="section" className="entries">
      <div className="card" aria-label="Logged entries" role="region">
        <div className="card-head">
          <h2 ref={headingRef} tabIndex={-1} className="outline-none">Entries</h2>
          <span className="entries-count">{observations.length}</span>
        </div>

        {observations.length === 0 ? (
          <div className="empty">
            <span className="empty-icon"><ScanLine className="size-5" aria-hidden /></span>
            <strong>Nothing logged yet</strong>
            <span>Tap a region on the body map to log the first one.</span>
          </div>
        ) : (
          <ul className="entry-list">
            {observations.map((o, i) => (
              <li
                key={o.id}
                data-testid="entry"
                className="entry"
                data-leaving={leaving.has(o.id) ? "" : undefined}
                style={{ "--i": (o.intensity ?? 5) / 10, "--rise-delay": `${Math.min(i, 8) * 0.045}s` } as React.CSSProperties}
              >
                <div className="entry-body">
                  <div className="entry-top">
                    <span className="entry-region">
                      {regionTitle(o.location.regionId, o.location.side)}
                    </span>
                    <span className="entry-tags">
                      <span className="tag tag-type">{o.type}</span>
                      {(o.quality ?? []).map((q) => (
                        <span key={q} className="tag">{q}</span>
                      ))}
                    </span>
                  </div>
                  <div className="entry-meta">
                    {o.intensity != null && <IntensityMeter value={o.intensity} />}
                    <span className="entry-time">{relTime(o.occurredAt)}</span>
                  </div>
                </div>
                <div className="entry-actions">
                  <Button type="button" variant="ghost" size="xs" onClick={() => setEditing(o)}>
                    <Pencil />
                    Edit
                  </Button>
                  <Button type="button" variant="destructive" size="xs" onClick={() => onDelete(o)}>
                    <Trash2 />
                    Delete
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <BottomSheet open={editing != null} onOpenChange={(open) => { if (!open) setEditing(null); }} title="Edit symptom entry">
        {shown && (
          <EntrySheet
            regionId={shown.location.regionId}
            regionLabel={regionTitle(shown.location.regionId, shown.location.side)}
            side={shown.location.side}
            view={shown.location.view}
            point={shown.location.point}
            initial={{
              type: shown.type, quality: shown.quality, intensity: shown.intensity,
              note: shown.note, contextTags: shown.contextTags, occurredAt: shown.occurredAt,
            }}
            onSubmit={async (patch) => {
              await edit(shown, patch);
              setEditing(null);
              announce(`Updated: ${describeEntry(regionTitle(shown.location.regionId, shown.location.side), patch.type, patch.intensity)}.`);
            }}
            onCancel={() => setEditing(null)}
          />
        )}
      </BottomSheet>
    </Rise>
  );
}
