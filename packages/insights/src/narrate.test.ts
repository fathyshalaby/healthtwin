import { describe, it, expect, vi } from "vitest";
import { templateNarrator, createLlmNarrator, buildInsightPrompt } from "./narrate";
import type { TwinSummary } from "./types";

const summary: TwinSummary = {
  range: {},
  total: 4,
  activeRegions: 2,
  byType: { pain: 4 },
  topRegions: [{ regionId: "knee", side: "left", label: "Left Knee", count: 3, meanIntensity: 6, maxIntensity: 9, lastOccurredAt: "2026-07-04T10:00:00.000Z", trend: "worsening" }],
  worsening: [{ regionId: "knee", side: "left", label: "Left Knee", count: 3, meanIntensity: 6, maxIntensity: 9, lastOccurredAt: "2026-07-04T10:00:00.000Z", trend: "worsening" }],
  flares: [{ regionId: "knee", side: "left", label: "Left Knee", at: "2026-07-04T10:00:00.000Z", intensity: 9 }],
  contexts: [{ tag: "after-PT", count: 2, meanIntensity: 7 }],
  streakDays: 3,
  lastEntryAt: "2026-07-04T10:00:00.000Z",
};

describe("templateNarrator", () => {
  it("produces factual clinical prose", async () => {
    const text = await templateNarrator().narrate(summary);
    expect(text).toContain("4 entries across 2 regions");
    expect(text).toContain("Left Knee");
    expect(text).toContain("Worsening");
    expect(text).toContain("flare");
    expect(text).toContain("after-PT");
  });

  it("handles an empty period", async () => {
    expect(await templateNarrator().narrate({ ...summary, total: 0 })).toBe("No entries in this period.");
  });
});

describe("createLlmNarrator", () => {
  it("passes the built prompt to the injected LLM and returns its text", async () => {
    const complete = vi.fn(async () => "  LLM summary.  ");
    const text = await createLlmNarrator(complete).narrate(summary);
    expect(text).toBe("LLM summary.");
    expect(complete).toHaveBeenCalledWith(buildInsightPrompt(summary));
  });
});
