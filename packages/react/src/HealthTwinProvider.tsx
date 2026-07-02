import * as React from "react";
import {
  createObservation,
  type LocalStore, type Observation, type NewObservation,
} from "@healthtwin/core";

export interface HealthTwinContextValue {
  all: Observation[];
  loading: boolean;
  add: (input: NewObservation) => Promise<void>;
  refresh: () => Promise<void>;
}

export const HealthTwinContext = React.createContext<HealthTwinContextValue | null>(null);

export const HealthTwinProvider: React.FC<{
  store: LocalStore;
  subjectId: string;
  origin: string;
  children: React.ReactNode;
}> = ({ store, subjectId, origin, children }) => {
  // Single source of truth: the raw log lives here so every useObservations
  // consumer shares one reactive list and add() updates all of them.
  const [all, setAll] = React.useState<Observation[]>([]);
  const [loading, setLoading] = React.useState(true);

  const refresh = React.useCallback(async () => {
    setAll(await store.all());
    setLoading(false);
  }, [store]);

  React.useEffect(() => { void refresh(); }, [refresh]);

  const add = React.useCallback(async (input: NewObservation) => {
    const record = createObservation(input, { subjectId, origin });
    await store.append(record);
    await refresh();
  }, [store, subjectId, origin, refresh]);

  const value = React.useMemo<HealthTwinContextValue>(
    () => ({ all, loading, add, refresh }),
    [all, loading, add, refresh],
  );

  return <HealthTwinContext.Provider value={value}>{children}</HealthTwinContext.Provider>;
};
