import * as React from "react";
import { BodyMap, type BodyMapSelection } from "@healthtwin/bodymap-react";
import { getRegion, type BodyView } from "@healthtwin/core";
import { useObservations } from "./useObservations";
import { EntrySheet } from "./EntrySheet";

export interface BodyMapCaptureProps { view?: BodyView; }

export const BodyMapCapture: React.FC<BodyMapCaptureProps> = ({ view = "anterior" }) => {
  const { add } = useObservations();
  const [sel, setSel] = React.useState<BodyMapSelection | null>(null);

  return (
    <div>
      <BodyMap view={view} selectedKey={sel?.key} onSelect={setSel} />
      {sel && (
        <EntrySheet
          regionId={sel.regionId}
          regionLabel={getRegion(sel.regionId)?.label ?? sel.regionId}
          side={sel.side}
          view={sel.view}
          point={sel.point}
          onSubmit={async (input) => { await add(input); setSel(null); }}
          onCancel={() => setSel(null)}
        />
      )}
    </div>
  );
};
