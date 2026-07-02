import * as React from "react";
import { foldLog, queryObservations, type ObservationFilter } from "@healthtwin/core";
import { HealthTwinContext } from "./HealthTwinProvider";

export function useObservations() {
  const ctx = React.useContext(HealthTwinContext);
  if (!ctx) throw new Error("useObservations must be used within HealthTwinProvider");
  const { all, loading, syncing, add, edit, remove, sync } = ctx;

  const observations = React.useMemo(() => foldLog(all), [all]);
  const query = React.useCallback(
    (f?: ObservationFilter) => queryObservations(observations, f),
    [observations],
  );

  return { observations, add, edit, remove, query, loading, sync, syncing };
}
