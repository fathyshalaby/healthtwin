export interface PartnerSession {
  token: string;
  subjectId: string;
}

/**
 * Exchange a short-lived, partner-signed token for a HealthTwin session.
 * The partner's server mints `partnerToken`; the HealthTwin endpoint verifies it
 * and returns a scoped session bound to the partner's user.
 */
export async function exchangePartnerToken(endpoint: string, partnerToken: string): Promise<PartnerSession> {
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ partnerToken }),
  });
  if (!res.ok) throw new Error(`token exchange failed: ${res.status}`);
  return (await res.json()) as PartnerSession;
}
