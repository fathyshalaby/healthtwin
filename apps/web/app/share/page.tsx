"use client";
import * as React from "react";
import { createGrant, listGrants, revokeGrant, type ConsentGrant } from "@healthtwin/supabase";
import { getCloudConfig } from "../../src/cloud";
import { PageHeader } from "../../src/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
        <PageHeader eyebrow="Share" title="Share with a clinician">
          Sharing needs cloud mode — set <code>NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
          <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>. Grants stay on the server; they are not a copy of the log.
        </PageHeader>
        <p className="empty">This device is local-only. Cloud env is not configured.</p>
      </>
    );
  }

  return (
    <>
      <PageHeader eyebrow="Share" title="Share with a clinician">
        A scoped, revocable grant — not a copy. The clinician reads your rows through RLS for as long as the grant is live.
      </PageHeader>

      <form
        className="card grid gap-3"
        onSubmit={async (e) => {
          e.preventDefault();
          await createGrant(cloud.client, { grantee });
          setGrantee("");
          await refresh();
        }}
      >
        <Label htmlFor="grantee">Clinician user id</Label>
        <Input id="grantee" value={grantee} onChange={(e) => setGrantee(e.target.value)} required />
        <Button type="submit">Grant read access</Button>
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
                <Button
                  type="button"
                  variant="destructive"
                  size="xs"
                  onClick={async () => { await revokeGrant(cloud.client, g.id); await refresh(); }}
                >
                  Revoke
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
