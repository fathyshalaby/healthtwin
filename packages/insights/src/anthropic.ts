import Anthropic from "@anthropic-ai/sdk";
import { createLlmNarrator, type Narrator } from "./narrate";

// Minimal structural shape so the adapter is testable without the concrete SDK client.
interface MessageLike { content: Array<{ type: string; text?: string }> }
interface AnthropicLike { messages: { create(args: unknown): Promise<MessageLike> } }

export interface AnthropicOptions {
  apiKey?: string;      // defaults to ANTHROPIC_API_KEY via the SDK
  model?: string;       // defaults to Claude Opus 4.8
  maxTokens?: number;   // the summary is short; 1024 is plenty
  client?: AnthropicLike; // inject for testing
}

/** A completion function backed by Claude — pass to createLlmNarrator. */
export function createAnthropicComplete(opts: AnthropicOptions = {}): (prompt: string) => Promise<string> {
  const model = opts.model ?? "claude-opus-4-8";
  const maxTokens = opts.maxTokens ?? 1024;
  const client: AnthropicLike =
    opts.client ?? (new Anthropic(opts.apiKey ? { apiKey: opts.apiKey } : {}) as unknown as AnthropicLike);

  return async (prompt: string) => {
    const res = await client.messages.create({
      model,
      max_tokens: maxTokens,
      messages: [{ role: "user", content: prompt }],
    });
    return res.content
      .filter((b) => b.type === "text")
      .map((b) => b.text ?? "")
      .join("")
      .trim();
  };
}

/** A Narrator backed by Claude. Requires @anthropic-ai/sdk + ANTHROPIC_API_KEY (or opts.apiKey). */
export function anthropicNarrator(opts: AnthropicOptions = {}): Narrator {
  return createLlmNarrator(createAnthropicComplete(opts));
}
