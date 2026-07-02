"use client";
import * as React from "react";
import Link from "next/link";
import { createGrant, listGrants, revokeGrant, type ConsentGrant } from "@healthtwin/supabase";
import { getCloudConfig } from "../../src/cloud";

export default function Share() {
  const cloud = React.useMemo(() => getCloudConfig(), []);
  const [grants, setGrants] = React.useState<ConsentGrant[]>([]);
  const [grantee, setGrantee] = React.useState("");

  const refresh = React.useCallback(async () => {
    if (cloud) setGrants(await listGrants(cloud.client));
  }, [cloud]);

  React.useEffect(() => { void refresh(); }, [refresh]);

  if (!cloud) {
    return (
      <main style={{ maxWidth: 480, margin: "0 auto", padding: 16 }}>
        <h1>Share</h1>
        <p>Sharing requires cloud mode — set <code>NEXT_PUBLIC_SUPABASE_*</code>.</p>
        <Link href="/">← Capture</Link>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 480, margin: "0 auto", padding: 16 }}>
      <h1>Share with a clinician</h1>
      <nav><Link href="/">← Capture</Link></nav>

      <form onSubmit={async (e) => { e.preventDefault(); await createGrant(cloud.client, { grantee }); setGrantee(""); await refresh(); }}>
        <label htmlFor="grantee">Clinician user id</label>
        <input id="grantee" value={grantee} onChange={(e) => setGrantee(e.target.value)} required />
        <button type="submit">Grant read access</button>
      </form>

      <ul>
        {grants.map((g) => (
          <li key={g.id}>
            {g.grantee} — {g.scope}{g.revoked ? " (revoked)" : ""}{" "}
            {!g.revoked && (
              <button type="button" onClick={async () => { await revokeGrant(cloud.client, g.id); await refresh(); }}>
                Revoke
              </button>
            )}
          </li>
        ))}
      </ul>
    </main>
  );
}
