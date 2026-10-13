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
import { MailCheck } from "lucide-react";

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
        className="card mx-auto mt-10 grid max-w-sm gap-4 p-7"
        onSubmit={async (e) => {
          e.preventDefault();
          if (cloud) { await signInWithEmailOtp(cloud.client, email); setSent(true); }
        }}
      >
        <div>
          <p className="eyebrow">Cloud</p>
          <h1 className="font-heading mt-2 text-2xl font-semibold tracking-tight">Sign in to HealthTwin</h1>
          <p className="muted mt-1.5">We&apos;ll email you a magic link — no password to remember.</p>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" required autoComplete="email" placeholder="you@example.com" className="h-11 rounded-xl" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <Button type="submit" size="lg">Send magic link</Button>
        {sent && (
          <p className="flex items-center gap-2 rounded-xl bg-mint/10 px-3 py-2.5 text-sm text-foreground" role="status">
            <MailCheck className="size-4 text-mint" aria-hidden /> Check your email for a sign-in link.
          </p>
        )}
      </form>
    );
  }

  // First paint while IndexedDB opens: a quiet skeleton instead of a blank page.
  if (!ready) {
    return (
      <div aria-busy="true" aria-label="Loading your twin" role="status" className="grid gap-4">
        <div className="skeleton h-14 rounded-2xl" />
        <div className="skeleton h-9 w-2/3 rounded-xl" />
        <div className="grid gap-4 md:grid-cols-2">
          <div className="skeleton h-[420px] rounded-3xl" />
          <div className="skeleton h-[240px] rounded-3xl" />
        </div>
      </div>
    );
  }

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
