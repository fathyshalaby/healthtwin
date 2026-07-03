import * as React from "react";
import { createSample, type NewSample, type Sample, type SampleStore } from "@healthtwin/vitals";

/** Local-first vitals state over a native SampleStore (createSqliteSampleStore). */
export function useNativeVitals(store: SampleStore) {
  const [samples, setSamples] = React.useState<Sample[]>([]);

  const refresh = React.useCallback(async () => { setSamples(await store.all()); }, [store]);
  React.useEffect(() => { void refresh(); }, [refresh]);

  const addSample = React.useCallback(
    async (input: NewSample, subjectId: string) => {
      await store.append(createSample(input, { subjectId }));
      await refresh();
    },
    [store, refresh],
  );

  return { samples, addSample, refresh };
}
