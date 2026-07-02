import { createHmac, timingSafeEqual } from "node:crypto";

// Server-only (node:crypto). Not exported from the package index.
// Import via "@healthtwin/supabase/webhooks".

/** Sign a raw JSON body → "sha256=<hex>". Matches the DB dispatch trigger (migration 0007). */
export function signWebhookPayload(rawBody: string, secret: string): string {
  return `sha256=${createHmac("sha256", secret).update(rawBody).digest("hex")}`;
}

/** Verify an inbound HealthTwin webhook. Compare against the RAW request body bytes. */
export function verifyWebhookSignature(rawBody: string, signature: string, secret: string): boolean {
  const expected = signWebhookPayload(rawBody, secret);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
