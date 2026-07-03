import * as React from "react";
import { createSample, type NewSample, type Sample, type SampleStore } from "@healthtwin/vitals";

export interface UseVitals {
  samples: Sample[];
  loading: boolean;
  addSample(input: NewSample, subjectId: string): Promise<void>;
  refresh(): Promise<void>;
}

/** Local-first vitals state over a SampleStore (e.g. createIdbSampleStore()). */
export function useVitals(store: SampleStore): UseVitals {
  const [samples, setSamples] = React.useState<Sample[]>([]);
  const [loading, setLoading] = React.useState(true);

  const refresh = React.useCallback(async () => {
    setSamples(await store.all());
    setLoading(false);
  }, [store]);

  React.useEffect(() => { void refresh(); }, [refresh]);

  const addSample = React.useCallback(
    async (input: NewSample, subjectId: string) => {
      await store.append(createSample(input, { subjectId }));
      await refresh();
    },
    [store, refresh],
  );

  return { samples, loading, addSample, refresh };
}
