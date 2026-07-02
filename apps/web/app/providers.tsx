"use client";
import * as React from "react";
import { HealthTwinProvider, createIdbStore } from "@healthtwin/react";
import type { LocalStore } from "@healthtwin/core";

interface Ready {
  store: LocalStore;
  subjectId: string;
  origin: string;
}

export function Providers({ children }: { children: React.ReactNode }) {
  // Initialise on the client only — localStorage/crypto are unavailable during SSR.
  const [ready, setReady] = React.useState<Ready | null>(null);

  React.useEffect(() => {
    const get = (k: string) => {
      const cur = window.localStorage.getItem(k);
      if (cur) return cur;
      const v = crypto.randomUUID();
      window.localStorage.setItem(k, v);
      return v;
    };
    setReady({
      store: createIdbStore("healthtwin"),
      subjectId: get("ht_subject"),
      origin: get("ht_origin"),
    });
  }, []);

  if (!ready) return null;

  return (
    <HealthTwinProvider store={ready.store} subjectId={ready.subjectId} origin={ready.origin}>
      {children}
    </HealthTwinProvider>
  );
}
