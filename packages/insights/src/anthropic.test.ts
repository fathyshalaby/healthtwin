import { describe, it, expect, vi } from "vitest";
import { createAnthropicComplete, anthropicNarrator } from "./anthropic";
import type { TwinSummary } from "./types";

const emptySummary: TwinSummary = {
  range: {}, total: 0, activeRegions: 0, byType: {}, topRegions: [],
  worsening: [], flares: [], contexts: [], streakDays: 0, lastEntryAt: null,
};

describe("createAnthropicComplete", () => {
  it("sends the prompt and joins text blocks (dropping non-text)", async () => {
    const create = vi.fn(async () => ({ content: [{ type: "thinking" }, { type: "text", text: " Summary. " }] }));
    const complete = createAnthropicComplete({ client: { messages: { create } }, model: "claude-haiku-4-5" });

    const out = await complete("PROMPT");

    expect(out).toBe("Summary.");
    expect(create).toHaveBeenCalledWith(expect.objectContaining({
      model: "claude-haiku-4-5",
      messages: [{ role: "user", content: "PROMPT" }],
    }));
  });
});

describe("anthropicNarrator", () => {
  it("wraps createLlmNarrator and returns the model's text", async () => {
    const create = vi.fn(async () => ({ content: [{ type: "text", text: "Clinical summary." }] }));
    const text = await anthropicNarrator({ client: { messages: { create } } }).narrate(emptySummary);

    expect(text).toBe("Clinical summary.");
    expect(create).toHaveBeenCalledOnce();
  });
});
