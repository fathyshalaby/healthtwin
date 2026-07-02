import * as React from "react";
import {
  createObservation, foldLog, queryObservations,
  type Observation, type NewObservation, type ObservationFilter,
} from "@healthtwin/core";
import { HealthTwinContext } from "./HealthTwinProvider";

export function useObservations() {
  const ctx = React.useContext(HealthTwinContext);
  if (!ctx) throw new Error("useObservations must be used within HealthTwinProvider");
  const { store, subjectId, origin } = ctx;

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

  const observations = React.useMemo(() => foldLog(all), [all]);
  const query = React.useCallback(
    (f?: ObservationFilter) => queryObservations(observations, f),
    [observations],
  );

  return { observations, add, query, loading };
}
