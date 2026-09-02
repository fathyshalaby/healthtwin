"use client";
import * as React from "react";
import { HealthTwinProvider, createIdbStore } from "@healthtwin/react";
import { currentUserId, signInWithEmailOtp } from "@healthtwin/supabase";
import type { LocalStore, SyncAdapter, SyncMeta } from "@healthtwin/core";
import { getCloudConfig } from "../src/cloud";
import { DataBar } from "../src/DataBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Ready {
  store: LocalStore;
  subjectId: string;
  origin: string;
  adapter?: SyncAdapter;
  syncMeta?: SyncMeta;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = React.useState<Ready | null>(null);
  const [needSignIn, setNeedSignIn] = React.useState(false);
  const [email, setEmail] = React.useState("");
  const [sent, setSent] = React.useState(false);

  React.useEffect(() => {
    // localStorage/crypto are client-only; this effect never runs during SSR.
    const localId = (k: string) => {
      const cur = window.localStorage.getItem(k);
      if (cur) return cur;
      const v = crypto.randomUUID();
      window.localStorage.setItem(k, v);
      return v;
    };
    const store = createIdbStore("healthtwin");
    const origin = localId("ht_origin");

    const cloud = getCloudConfig();
    if (!cloud) {
      // Local-only mode (default). subjectId is a local device identity.
      setReady({ store, subjectId: localId("ht_subject"), origin });
      return;
    }
    // Cloud mode: subjectId MUST be the authenticated user id for RLS.
    void (async () => {
      const uid = await currentUserId(cloud.client);
      if (!uid) { setNeedSignIn(true); return; }
      setReady({ store, subjectId: uid, origin, adapter: cloud.adapter, syncMeta: cloud.syncMeta });
    })();
  }, []);

  if (needSignIn && !ready) {
    const cloud = getCloudConfig();
    return (
      <form
        style={{ maxWidth: 360, margin: "40px auto", padding: 16 }}
        onSubmit={async (e) => {
          e.preventDefault();
          if (cloud) { await signInWithEmailOtp(cloud.client, email); setSent(true); }
        }}
      >
        <h1 className="font-heading text-2xl font-semibold">Sign in to HealthTwin</h1>
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <Button type="submit">Send magic link</Button>
        {sent && <p>Check your email for a sign-in link.</p>}
      </form>
    );
  }

  if (!ready) return null;

  return (
    <HealthTwinProvider
      store={ready.store}
      subjectId={ready.subjectId}
      origin={ready.origin}
      adapter={ready.adapter}
      syncMeta={ready.syncMeta}
    >
      <DataBar />
      {children}
    </HealthTwinProvider>
  );
}
