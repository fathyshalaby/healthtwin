import * as React from "react";
import {
  createObservation, editObservation, tombstoneObservation, runSync,
  type LocalStore, type Observation, type NewObservation,
  type SyncAdapter, type SyncMeta,
} from "@healthtwin/core";

export interface HealthTwinContextValue {
  all: Observation[];
  loading: boolean;
  syncing: boolean;
  add: (input: NewObservation) => Promise<void>;
  edit: (prev: Observation, patch: Partial<NewObservation>) => Promise<void>;
  remove: (prev: Observation) => Promise<void>;
  refresh: () => Promise<void>;
  sync: () => Promise<void>;
}

export const HealthTwinContext = React.createContext<HealthTwinContextValue | null>(null);

export const HealthTwinProvider: React.FC<{
  store: LocalStore;
  subjectId: string;
  origin: string;
  adapter?: SyncAdapter;
  syncMeta?: SyncMeta;
  children: React.ReactNode;
}> = ({ store, subjectId, origin, adapter, syncMeta, children }) => {
  const [all, setAll] = React.useState<Observation[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [syncing, setSyncing] = React.useState(false);

  const refresh = React.useCallback(async () => {
    setAll(await store.all());
    setLoading(false);
  }, [store]);

  React.useEffect(() => { void refresh(); }, [refresh]);

  const sync = React.useCallback(async () => {
    if (!adapter || !syncMeta) return;
    setSyncing(true);
    try {
      await runSync(store, syncMeta, adapter);
      await refresh();
    } finally {
      setSyncing(false);
    }
  }, [adapter, syncMeta, store, refresh]);

  React.useEffect(() => { void sync(); }, [sync]);

  const append = React.useCallback(async (record: Observation) => {
    await store.append(record);
    await refresh();
    void sync();
  }, [store, refresh, sync]);

  const ctx = { subjectId, origin };
  const add = React.useCallback(
    (input: NewObservation) => append(createObservation(input, ctx)),
    [append, subjectId, origin],
  );
  const edit = React.useCallback(
    (prev: Observation, patch: Partial<NewObservation>) => append(editObservation(prev, patch, ctx)),
    [append, subjectId, origin],
  );
  const remove = React.useCallback(
    (prev: Observation) => append(tombstoneObservation(prev, ctx)),
    [append, subjectId, origin],
  );

  const value = React.useMemo<HealthTwinContextValue>(
    () => ({ all, loading, syncing, add, edit, remove, refresh, sync }),
    [all, loading, syncing, add, edit, remove, refresh, sync],
  );

  return <HealthTwinContext.Provider value={value}>{children}</HealthTwinContext.Provider>;
};
