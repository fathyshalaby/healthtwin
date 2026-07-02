import { describe, it, expect } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { createMemoryStore, createMemorySyncMeta, type SyncAdapter, type Observation } from "@healthtwin/core";
import { HealthTwinProvider } from "./HealthTwinProvider";
import { useObservations } from "./useObservations";

const remote = (id: string): Observation => ({
  id, subjectId: "s", occurredAt: "2026-07-02T10:00:00.000Z", createdAt: "2026-07-02T10:00:00.000Z",
  location: { regionId: "knee", side: "left", view: "anterior" }, type: "pain",
  taxonomyVersion: "1.0.0", origin: "remote",
});

function Reader() {
  const { observations, loading } = useObservations();
  if (loading) return <p>loading</p>;
  return <p>reader: {observations.length}</p>;
}

describe("provider sync", () => {
  it("pulls remote records on mount when an adapter is configured", async () => {
    const rec = remote("Z".repeat(26));
    const adapter: SyncAdapter = {
      async push() { return { acked: [] }; },
      async pull() { return { records: [rec], cursor: "1" }; },
    };
    render(
      <HealthTwinProvider
        store={createMemoryStore()} subjectId="s" origin="d"
        adapter={adapter} syncMeta={createMemorySyncMeta()}
      >
        <Reader />
      </HealthTwinProvider>,
    );
    await waitFor(() => screen.getByText("reader: 1"));
  });
});
