import type { Observation } from "@healthtwin/core";

// A deterministic synthetic cohort so the partner dashboard has something real to
// aggregate in local/demo mode. No Date.now()/Math.random at module scope — stable
// across renders and SSR. In production these numbers come from cohortSummary over
// the partner's own (RLS-isolated) rows via /api/partner/analytics.

const REGIONS = [
  { id: "knee", w: 6 }, { id: "lower_back", w: 6 }, { id: "shoulder", w: 4 },
  { id: "neck", w: 3 }, { id: "hand", w: 2 }, { id: "foot", w: 2 },
  { id: "thigh", w: 2 }, { id: "abdomen", w: 2 }, { id: "head", w: 2 },
];
const SIDES = ["left", "right", "central"] as const;
const TYPES = [
  { t: "pain", w: 8 }, { t: "stiffness", w: 4 }, { t: "swelling", w: 2 },
  { t: "numbness", w: 2 }, { t: "tingling", w: 2 }, { t: "weakness", w: 1 },
];

const REF = Date.parse("2026-07-03T12:00:00.000Z");

function rng(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

function pickWeighted(items: { w: number }[], r: number): number {
  const total = items.reduce((s, i) => s + i.w, 0);
  let acc = r * total;
  for (let i = 0; i < items.length; i++) { acc -= items[i].w; if (acc <= 0) return i; }
  return items.length - 1;
}

export function demoCohort(userCount = 42): Observation[] {
  const obs: Observation[] = [];
  let n = 0;
  for (let u = 0; u < userCount; u++) {
    const subjectId = `user-${u}`;
    const count = 3 + Math.floor(rng(u + 1) * 10); // 3..12
    const inactive = rng(u * 7 + 3) < 0.3;          // ~30% lapsed
    for (let k = 0; k < count; k++) {
      const s = u * 100 + k * 7 + 1;
      const region = REGIONS[pickWeighted(REGIONS, rng(s))].id;
      const side = SIDES[Math.floor(rng(s + 1) * 3)];
      const type = TYPES[pickWeighted(TYPES, rng(s + 2))].t;
      const intensity = 2 + Math.floor(rng(s + 3) * 8); // 2..9
      const daysAgo = inactive ? 32 + Math.floor(rng(s + 4) * 60) : Math.floor(rng(s + 4) * 28);
      const at = new Date(REF - daysAgo * 86_400_000).toISOString();
      obs.push({
        id: String(n++).padStart(26, "0"),
        subjectId,
        occurredAt: at, createdAt: at,
        location: { regionId: region, side, view: "anterior" },
        type: type as Observation["type"],
        intensity,
        taxonomyVersion: "1.1.0",
        origin: "demo",
      });
    }
  }
  return obs;
}
