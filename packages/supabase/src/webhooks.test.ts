import { describe, it, expect } from "vitest";
import { signWebhookPayload, verifyWebhookSignature } from "./webhooks";

const body = '{"type":"observation.created","partnerId":"p1"}';

describe("webhook signatures", () => {
  it("round-trips a valid signature", () => {
    const sig = signWebhookPayload(body, "secret");
    expect(sig.startsWith("sha256=")).toBe(true);
    expect(verifyWebhookSignature(body, sig, "secret")).toBe(true);
  });

  it("rejects a wrong secret", () => {
    expect(verifyWebhookSignature(body, signWebhookPayload(body, "secret"), "other")).toBe(false);
  });

  it("rejects a tampered body", () => {
    expect(verifyWebhookSignature(`${body} `, signWebhookPayload(body, "secret"), "secret")).toBe(false);
  });
});
