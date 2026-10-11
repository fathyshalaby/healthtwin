"use client";
import * as React from "react";
import { Cloud, ShieldCheck, UserCheck } from "lucide-react";
import { createGrant, listGrants, revokeGrant, type ConsentGrant } from "@healthtwin/supabase";
import { getCloudConfig } from "../../src/cloud";
import { PageHeader } from "../../src/components/PageHeader";
import { Rise } from "@/components/motion";
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
        <Rise className="empty">
          <span className="empty-icon"><Cloud className="size-5" aria-hidden /></span>
          <strong>This device is local-only</strong>
          <span>Cloud env is not configured. Until then, the JSON download or the printable report is the handoff.</span>
        </Rise>
      </>
    );
  }

  return (
    <>
      <PageHeader eyebrow="Share" title="Share with a clinician">
        A scoped, revocable grant — not a copy. The clinician reads your rows through RLS for as long as the grant is live.
      </PageHeader>

      <Rise
        as="section"
        className="card"
      >
        <form
          className="grid gap-3"
          onSubmit={async (e) => {
            e.preventDefault();
            await createGrant(cloud.client, { grantee });
            setGrantee("");
            await refresh();
          }}
        >
          <Label htmlFor="grantee">Clinician user id</Label>
          <Input id="grantee" className="h-11 rounded-xl" value={grantee} onChange={(e) => setGrantee(e.target.value)} required />
          <Button type="submit" size="lg"><ShieldCheck /> Grant read access</Button>
        </form>
      </Rise>

      {grants.length === 0 ? (
        <div className="empty"><strong>No grants yet</strong><span>Grants you create appear here and can be revoked any time.</span></div>
      ) : (
        <ul className="entry-list">
          {grants.map((g) => (
            <li key={g.id} className="entry" style={{ "--i": g.revoked ? 0.9 : 0.1 } as React.CSSProperties}>
              <div className="entry-body">
                <span className="entry-region flex items-center gap-2"><UserCheck className="size-4 text-muted-foreground" aria-hidden />{g.grantee}</span>
                <span className="entry-time">{g.scope}{g.revoked ? " · revoked" : " · live"}</span>
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
