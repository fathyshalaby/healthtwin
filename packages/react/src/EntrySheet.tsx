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

/** Plain-language read of a 0–10 intensity, shown beside the slider. */
export function intensityWord(n: number): string {
  if (n <= 0) return "None";
  if (n <= 3) return "Mild";
  if (n <= 6) return "Moderate";
  if (n <= 8) return "Severe";
  return "Worst";
}

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

  // Unique per instance so two sheets on one page never collide on label→control ids.
  const uid = React.useId();
  const id = (name: string) => `${uid}-${name}`;

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
    <form onSubmit={submit} aria-label={`Log symptom for ${regionLabel}`} className="ht-entry">
      <h2>{regionLabel}</h2>

      <label htmlFor={id("type")}>Type</label>
      <select id={id("type")} value={type} onChange={(e) => setType(e.target.value as ObservationType)}>
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

      <label htmlFor={id("intensity")}>Intensity</label>
      <div className="intensity-row">
        <input id={id("intensity")} type="range" min={0} max={10} step={1}
          value={intensity} onChange={(e) => setIntensity(Number(e.target.value))}
          style={{ "--ht-i": intensity / 10 } as React.CSSProperties} />
        <output htmlFor={id("intensity")} aria-live="polite">{intensity}</output>
      </div>
      <span className="intensity-word" aria-hidden="true">{intensityWord(intensity)}</span>

      <label htmlFor={id("occurredAt")}>Time</label>
      <input id={id("occurredAt")} type="datetime-local"
        value={occurredLocal} onChange={(e) => setOccurredLocal(e.target.value)} />

      <label htmlFor={id("note")}>Note</label>
      <textarea id={id("note")} value={note} placeholder="What were you doing? What made it better or worse?"
        onChange={(e) => setNote(e.target.value)} />

      <label htmlFor={id("tags")}>Context tags (comma-separated)</label>
      <input id={id("tags")} value={tags} placeholder="after-PT, morning, desk day"
        onChange={(e) => setTags(e.target.value)} />

      <div className="ht-actions">
        <button type="submit">Save</button>
        <button type="button" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
};
