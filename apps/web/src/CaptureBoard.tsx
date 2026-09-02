"use client";
import * as React from "react";
import { BodyMap, ViewToggle, EntrySheet, useObservations, type BodyMapSelection } from "@healthtwin/react";
import { getRegion, type BodyView } from "@healthtwin/core";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent } from "@/components/ui/sheet";

/** The capture experience: a diagnostic plate with the body figure and a modal entry sheet. */
export function CaptureBoard() {
  const { add } = useObservations();
  const [view, setView] = React.useState<BodyView>("anterior");
  const [sel, setSel] = React.useState<BodyMapSelection | null>(null);
  const close = () => setSel(null);

  return (
    <>
      <Card className="plate" aria-label="Body map">
        <CardHeader className="flex flex-row items-center justify-between gap-2 border-b pb-3 font-mono text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
          <span>{view === "anterior" ? "Anterior" : "Posterior"} · today</span>
          <Badge variant="outline" className="font-mono text-[10px] tracking-wide text-primary">
            tap where it hurts
          </Badge>
        </CardHeader>
        <CardContent className="pt-4">
          <ViewToggle view={view} onChange={(nv) => { setView(nv); close(); }} />
          <div className="figure">
            <BodyMap view={view} selectedKey={sel?.key} onSelect={setSel} />
          </div>
        </CardContent>
      </Card>

      <Sheet open={sel != null} onOpenChange={(open) => { if (!open) close(); }}>
        <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto sm:mx-auto sm:max-w-lg sm:rounded-t-2xl">
          {sel && (
            <EntrySheet
              regionId={sel.regionId}
              regionLabel={getRegion(sel.regionId)?.label ?? sel.regionId}
              side={sel.side}
              view={sel.view}
              point={sel.point}
              onSubmit={async (input) => { await add(input); close(); }}
              onCancel={close}
            />
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
