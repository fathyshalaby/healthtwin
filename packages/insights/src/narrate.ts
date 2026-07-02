import type { TwinSummary } from "./types";

export interface Narrator {
  narrate(summary: TwinSummary): Promise<string>;
}

/** Prompt for an LLM narrator — factual clinician-facing summary, no diagnosis. */
export function buildInsightPrompt(summary: TwinSummary): string {
  return [
    "You are a clinical assistant. In 4–6 sentences, summarize this patient's self-reported",
    "body-symptom data for a clinician. Be factual; note trends, flares, and context patterns;",
    "do not diagnose or advise treatment. Data (JSON):",
    "",
    JSON.stringify(summary),
  ].join("\n");
}

/** Deterministic, dependency-free clinical prose from the structured summary. */
export function templateNarrator(): Narrator {
  return {
    async narrate(s) {
      if (s.total === 0) return "No entries in this period.";
      const parts: string[] = [];
      parts.push(`${s.total} ${s.total === 1 ? "entry" : "entries"} across ${s.activeRegions} region${s.activeRegions === 1 ? "" : "s"}.`);

      const top = s.topRegions[0];
      if (top) {
        parts.push(`Most reported: ${top.label} (${top.count}×${top.meanIntensity != null ? `, avg ${top.meanIntensity.toFixed(1)}/10` : ""}).`);
      }
      if (s.worsening.length) parts.push(`Worsening: ${s.worsening.map((w) => w.label).join(", ")}.`);
      if (s.flares.length) {
        parts.push(`${s.flares.length} flare${s.flares.length === 1 ? "" : "s"} (≥7/10); most recent ${s.flares[0].label} on ${s.flares[0].at.slice(0, 10)}.`);
      }
      const ctx = s.contexts.find((c) => c.meanIntensity != null);
      if (ctx) parts.push(`Highest-intensity context: "${ctx.tag}" (avg ${(ctx.meanIntensity as number).toFixed(1)}/10).`);
      if (s.streakDays > 1) parts.push(`${s.streakDays}-day logging streak.`);
      return parts.join(" ");
    },
  };
}

/**
 * Wire any LLM by injecting a completion function — e.g. Claude via the Anthropic SDK:
 *   createLlmNarrator(async (p) => (await anthropic.messages.create({ model, messages:[{role:'user',content:p}] })).content[0].text)
 */
export function createLlmNarrator(complete: (prompt: string) => Promise<string>): Narrator {
  return {
    async narrate(s) {
      return (await complete(buildInsightPrompt(s))).trim();
    },
  };
}
