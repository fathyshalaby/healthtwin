import * as React from "react";
import type { NewObservation, ObservationType, Quality, Side, BodyView } from "@healthtwin/core";

export interface EntrySheetProps {
  regionId: string;
  regionLabel: string;
  side: Side;
  view: BodyView;
  point?: { x: number; y: number };
  initial?: Partial<NewObservation>;   // prefill (for editing)
  onSubmit: (input: NewObservation) => void;
  onCancel: () => void;
}

const TYPES: ObservationType[] = ["pain", "stiffness", "numbness", "tingling", "swelling", "weakness", "other"];
const QUALITIES: Quality[] = ["sharp", "dull", "burning", "throbbing", "aching", "stabbing", "cramping"];

function toLocalInputValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export const EntrySheet: React.FC<EntrySheetProps> = ({
  regionId, regionLabel, side, view, point, initial, onSubmit, onCancel,
}) => {
  const [type, setType] = React.useState<ObservationType>(initial?.type ?? "pain");
  const [quality, setQuality] = React.useState<Quality[]>(initial?.quality ?? []);
  const [intensity, setIntensity] = React.useState(initial?.intensity ?? 5);
  const [note, setNote] = React.useState(initial?.note ?? "");
  const [tags, setTags] = React.useState((initial?.contextTags ?? []).join(", "));
  const [occurredLocal, setOccurredLocal] = React.useState(() =>
    toLocalInputValue(initial?.occurredAt ? new Date(initial.occurredAt) : new Date()),
  );

  const toggle = (q: Quality) =>
    setQuality((cur) => (cur.includes(q) ? cur.filter((x) => x !== q) : [...cur, q]));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const contextTags = tags.split(",").map((t) => t.trim()).filter(Boolean);
    onSubmit({
      location: { regionId, side, view, point },
      type,
      quality: quality.length ? quality : undefined,
      intensity,
      note: note.trim() || undefined,
      contextTags: contextTags.length ? contextTags : undefined,
      occurredAt: occurredLocal ? new Date(occurredLocal).toISOString() : undefined,
    });
  };

  return (
    <form onSubmit={submit} aria-label={`Log symptom for ${regionLabel}`}>
      <h2>{regionLabel}</h2>

      <label htmlFor="type">Type</label>
      <select id="type" value={type} onChange={(e) => setType(e.target.value as ObservationType)}>
        {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
      </select>

      <fieldset>
        <legend>Quality</legend>
        {QUALITIES.map((q) => (
          <label key={q}>
            <input type="checkbox" checked={quality.includes(q)} onChange={() => toggle(q)} /> {q}
          </label>
        ))}
      </fieldset>

      <label htmlFor="intensity">Intensity</label>
      <input id="intensity" type="range" min={0} max={10} step={1}
        value={intensity} onChange={(e) => setIntensity(Number(e.target.value))} />
      <output htmlFor="intensity" aria-live="polite">{intensity}</output>

      <label htmlFor="occurredAt">Time</label>
      <input id="occurredAt" type="datetime-local"
        value={occurredLocal} onChange={(e) => setOccurredLocal(e.target.value)} />

      <label htmlFor="note">Note</label>
      <textarea id="note" value={note} onChange={(e) => setNote(e.target.value)} />

      <label htmlFor="tags">Context tags (comma-separated)</label>
      <input id="tags" value={tags} onChange={(e) => setTags(e.target.value)} />

      <button type="submit">Save</button>
      <button type="button" onClick={onCancel}>Cancel</button>
    </form>
  );
};
