import { createHmac, timingSafeEqual } from "node:crypto";

// Server-only helpers (Node crypto). NOT exported from the package index so it
// never reaches a browser bundle. Import via "@healthtwin/supabase/src/partnerAuth".

export interface PartnerClaims {
  sub: string; // the partner's user id
  partnerId: string; // the partner (tenant) id
  exp?: number; // unix seconds
}

const b64urlJson = (obj: unknown): string => Buffer.from(JSON.stringify(obj)).toString("base64url");

/** Mint a partner-signed HS256 token (partner servers call this to bridge a user). */
export function signPartnerToken(claims: PartnerClaims, secret: string): string {
  const header = b64urlJson({ alg: "HS256", typ: "JWT" });
  const payload = b64urlJson(claims);
  const data = `${header}.${payload}`;
  const sig = createHmac("sha256", secret).update(data).digest("base64url");
  return `${data}.${sig}`;
}

/** Verify a partner token; throws on bad signature, expiry, or missing claims. */
export function verifyPartnerToken(token: string, secret: string): PartnerClaims {
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("malformed token");
  const [header, payload, sig] = parts;
  const expected = createHmac("sha256", secret).update(`${header}.${payload}`).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) throw new Error("bad signature");
  const claims = JSON.parse(Buffer.from(payload, "base64url").toString()) as PartnerClaims;
  if (typeof claims.exp === "number" && claims.exp * 1000 < Date.now()) throw new Error("token expired");
  if (!claims.sub || !claims.partnerId) throw new Error("missing sub/partnerId");
  return claims;
}
