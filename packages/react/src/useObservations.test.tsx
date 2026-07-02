import { describe, it, expect } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryStore } from "@healthtwin/core";
import { HealthTwinProvider } from "./HealthTwinProvider";
import { useObservations } from "./useObservations";

function Harness() {
  const { observations, add, loading } = useObservations();
  if (loading) return <p>loading</p>;
  return (
    <div>
      <button onClick={() => add({ location: { regionId: "knee", side: "left", view: "anterior" }, type: "pain", intensity: 5 })}>
        add
      </button>
      <p>count: {observations.length}</p>
    </div>
  );
}

describe("useObservations", () => {
  it("adds an observation and reflects it in the folded set", async () => {
    render(
      <HealthTwinProvider store={createMemoryStore()} subjectId="s" origin="d">
        <Harness />
      </HealthTwinProvider>,
    );
    await waitFor(() => screen.getByText("count: 0"));
    await userEvent.click(screen.getByText("add"));
    await waitFor(() => screen.getByText("count: 1"));
  });
});
