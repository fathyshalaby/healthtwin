import * as React from "react";
import {
  createObservation, foldLog,
  type LocalStore, type Observation, type NewObservation,
} from "@healthtwin/core";

interface Value {
  observations: Observation[];
  add: (input: NewObservation) => Promise<void>;
  loading: boolean;
}

const Ctx = React.createContext<Value | null>(null);

// DOM-free provider (React + @healthtwin/core only) — safe under React Native.
export function HealthTwinNativeProvider({
  store, subjectId, origin, children,
}: {
  store: LocalStore;
  subjectId: string;
  origin: string;
  children: React.ReactNode;
}) {
  const [all, setAll] = React.useState<Observation[]>([]);
  const [loading, setLoading] = React.useState(true);

  const refresh = React.useCallback(async () => {
    setAll(await store.all());
    setLoading(false);
  }, [store]);

  React.useEffect(() => { void refresh(); }, [refresh]);

  const add = React.useCallback(async (input: NewObservation) => {
    await store.append(createObservation(input, { subjectId, origin }));
    await refresh();
  }, [store, subjectId, origin, refresh]);

  const observations = React.useMemo(() => foldLog(all), [all]);

  return <Ctx.Provider value={{ observations, add, loading }}>{children}</Ctx.Provider>;
}

export function useNativeObservations(): Value {
  const c = React.useContext(Ctx);
  if (!c) throw new Error("useNativeObservations must be used within HealthTwinNativeProvider");
  return c;
}
