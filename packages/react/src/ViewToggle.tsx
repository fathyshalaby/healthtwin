import * as React from "react";
import type { BodyView } from "@healthtwin/core";

export const ViewToggle: React.FC<{ view: BodyView; onChange: (v: BodyView) => void }> = ({ view, onChange }) => (
  <div role="group" aria-label="Body view">
    <button type="button" aria-pressed={view === "anterior"} onClick={() => onChange("anterior")}>Front</button>
    <button type="button" aria-pressed={view === "posterior"} onClick={() => onChange("posterior")}>Back</button>
  </div>
);
