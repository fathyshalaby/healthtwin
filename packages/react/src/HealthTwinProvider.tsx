import * as React from "react";
import {
  createObservation, runSync,
  type LocalStore, type Observation, type NewObservation,
  type SyncAdapter, type SyncMeta,
} from "@healthtwin/core";

export interface HealthTwinContextValue {
  all: Observation[];
  loading: boolean;
  syncing: boolean;
  add: (input: NewObservation) => Promise<void>;
  refresh: () => Promise<void>;
  sync: () => Promise<void>;
}

export const HealthTwinContext = React.createContext<HealthTwinContextValue | null>(null);

export const HealthTwinProvider: React.FC<{
  store: LocalStore;
  subjectId: string;
  origin: string;
  adapter?: SyncAdapter;   // omit for local-only mode
  syncMeta?: SyncMeta;
  children: React.ReactNode;
}> = ({ store, subjectId, origin, adapter, syncMeta, children }) => {
  // Single source of truth: the raw log lives here so every useObservations
  // consumer shares one reactive list and add() updates all of them.
  const [all, setAll] = React.useState<Observation[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [syncing, setSyncing] = React.useState(false);

  const refresh = React.useCallback(async () => {
    setAll(await store.all());
    setLoading(false);
  }, [store]);

  React.useEffect(() => { void refresh(); }, [refresh]);

  const sync = React.useCallback(async () => {
    if (!adapter || !syncMeta) return; // no-op in local-only mode
    setSyncing(true);
    try {
      await runSync(store, syncMeta, adapter);
      await refresh();
    } finally {
      setSyncing(false);
    }
  }, [adapter, syncMeta, store, refresh]);

  // Initial sync when a backend is configured.
  React.useEffect(() => { void sync(); }, [sync]);

  const add = React.useCallback(async (input: NewObservation) => {
    const record = createObservation(input, { subjectId, origin });
    await store.append(record);
    await refresh();
    void sync(); // opportunistic background push/pull if configured
  }, [store, subjectId, origin, refresh, sync]);

  const value = React.useMemo<HealthTwinContextValue>(
    () => ({ all, loading, syncing, add, refresh, sync }),
    [all, loading, syncing, add, refresh, sync],
  );

  return <HealthTwinContext.Provider value={value}>{children}</HealthTwinContext.Provider>;
};
