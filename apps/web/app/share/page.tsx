"use client";
import * as React from "react";
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
      <>
        <div className="page-head">
          <span className="eyebrow">Share</span>
          <h1>Share with a clinician</h1>
          <p className="lede">
            Sharing needs cloud mode — set <code>NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
            <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>. Grants stay on the server; they are not a copy of the log.
          </p>
        </div>
        <p className="empty">This device is local-only. Cloud env is not configured.</p>
      </>
    );
  }

  return (
    <>
      <div className="page-head">
        <span className="eyebrow">Share</span>
        <h1>Share with a clinician</h1>
        <p className="lede">
          A scoped, revocable grant — not a copy. The clinician reads your rows through RLS for as long as the grant is live.
        </p>
      </div>

      <form
        className="card"
        onSubmit={async (e) => {
          e.preventDefault();
          await createGrant(cloud.client, { grantee });
          setGrantee("");
          await refresh();
        }}
      >
        <label htmlFor="grantee">Clinician user id</label>
        <input id="grantee" value={grantee} onChange={(e) => setGrantee(e.target.value)} required />
        <button type="submit" className="btn btn-primary">Grant read access</button>
      </form>

      {grants.length === 0 ? (
        <p className="empty">No grants yet.</p>
      ) : (
        <ul className="entry-list">
          {grants.map((g) => (
            <li key={g.id} className="entry">
              <div className="entry-body">
                <span className="entry-region">{g.grantee}</span>
                <span className="entry-meta">{g.scope}{g.revoked ? " · revoked" : ""}</span>
              </div>
              {!g.revoked && (
                <button
                  type="button"
                  className="icon-btn danger"
                  onClick={async () => { await revokeGrant(cloud.client, g.id); await refresh(); }}
                >
                  Revoke
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
