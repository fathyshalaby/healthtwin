"use client";
import * as React from "react";
import { useObservations, EntrySheet } from "@healthtwin/react";
import { getRegion, type Observation } from "@healthtwin/core";
import { IntensityMeter } from "./IntensityMeter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sheet, SheetContent } from "@/components/ui/sheet";

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
      <Card>
        <CardHeader className="flex flex-row items-baseline justify-between border-b pb-3">
          <CardTitle>Entries</CardTitle>
          <span className="font-mono text-sm text-muted-foreground">{observations.length}</span>
        </CardHeader>
        <CardContent className="pt-4">
          {observations.length === 0 ? (
            <p className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
              No entries yet. Tap a region on the body map to log the first one.
            </p>
          ) : (
            <ul className="m-0 grid list-none gap-2.5 p-0">
              {observations.map((o) => (
                <li
                  key={o.id}
                  data-testid="entry"
                  className="flex items-center gap-3 rounded-lg border bg-background/60 px-3 py-3"
                >
                  <div className="grid min-w-0 flex-1 gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-heading font-semibold tracking-tight">
                        {getRegion(o.location.regionId)?.label ?? o.location.regionId}
                      </span>
                      <span className="inline-flex flex-wrap gap-1">
                        <Badge variant="secondary" className="capitalize">{o.type}</Badge>
                        {(o.quality ?? []).map((q) => (
                          <Badge key={q} variant="outline" className="capitalize">{q}</Badge>
                        ))}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      {o.intensity != null && <IntensityMeter value={o.intensity} />}
                      <span className="font-mono text-xs text-muted-foreground">{relTime(o.occurredAt)}</span>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col gap-1">
                    <Button type="button" variant="ghost" size="xs" onClick={() => setEditing(o)}>Edit</Button>
                    <Button type="button" variant="destructive" size="xs" onClick={() => remove(o)}>Delete</Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Sheet open={editing != null} onOpenChange={(open) => { if (!open) setEditing(null); }}>
        <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto sm:mx-auto sm:max-w-lg sm:rounded-t-2xl">
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
        </SheetContent>
      </Sheet>
    </section>
  );
}
