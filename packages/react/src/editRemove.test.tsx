import { describe, it, expect } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryStore } from "@healthtwin/core";
import { HealthTwinProvider } from "./HealthTwinProvider";
import { useObservations } from "./useObservations";

function Harness() {
  const { observations, add, edit, remove, loading } = useObservations();
  if (loading) return <p>loading</p>;
  const o = observations[0];
  return (
    <div>
      <button onClick={() => add({ location: { regionId: "knee", side: "left", view: "anterior" }, type: "pain", intensity: 2 })}>add</button>
      {o && <button onClick={() => edit(o, { intensity: 9 })}>edit</button>}
      {o && <button onClick={() => remove(o)}>remove</button>}
      <p>count: {observations.length}</p>
      <p>intensity: {o?.intensity ?? "-"}</p>
    </div>
  );
}

describe("edit/remove via hook", () => {
  it("adds, edits (supersede), then removes (tombstone)", async () => {
    render(
      <HealthTwinProvider store={createMemoryStore()} subjectId="s" origin="d">
        <Harness />
      </HealthTwinProvider>,
    );
    await waitFor(() => screen.getByText("count: 0"));
    await userEvent.click(screen.getByText("add"));
    await waitFor(() => screen.getByText("count: 1"));
    await userEvent.click(screen.getByText("edit"));
    await waitFor(() => screen.getByText("intensity: 9"));
    await userEvent.click(screen.getByText("remove"));
    await waitFor(() => screen.getByText("count: 0"));
  });
});
