import { describe, it, expect } from "vitest";
import { createGrant, listGrants, revokeGrant } from "./consent";

type Call = [string, ...unknown[]];

function mockClient(result: unknown) {
  const calls: Call[] = [];
  const q: Record<string, unknown> = {};
  for (const m of ["insert", "select", "update", "eq", "order"]) {
    q[m] = (...args: unknown[]) => { calls.push([m, ...args]); return q; };
  }
  (q as { then: (r: (v: unknown) => void) => Promise<void> }).then = (r) => Promise.resolve(result).then(r);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return { client: { from: (t: string) => { calls.push(["from", t]); return q; } } as any, calls };
}

describe("consent grants", () => {
  it("createGrant inserts grantee + scope (grantor is server-defaulted)", async () => {
    const { client, calls } = mockClient({ error: null });
    await createGrant(client, { grantee: "user-b", scope: "knee" });
    const insert = calls.find((c) => c[0] === "insert");
    expect(insert?.[1]).toMatchObject({ grantee: "user-b", scope: "knee", expires_at: null });
  });

  it("listGrants maps rows to ConsentGrant", async () => {
    const row = { id: "g1", grantor: "a", grantee: "b", scope: "all", expires_at: null, revoked: false, created_at: "2026-07-02T00:00:00Z" };
    const { client } = mockClient({ data: [row], error: null });
    const grants = await listGrants(client);
    expect(grants[0]).toEqual({ id: "g1", grantor: "a", grantee: "b", scope: "all", expiresAt: null, revoked: false, createdAt: "2026-07-02T00:00:00Z" });
  });

  it("revokeGrant updates revoked=true for the id", async () => {
    const { client, calls } = mockClient({ error: null });
    await revokeGrant(client, "g1");
    expect(calls.find((c) => c[0] === "update")?.[1]).toEqual({ revoked: true });
    expect(calls.find((c) => c[0] === "eq")).toEqual(["eq", "id", "g1"]);
  });
});
