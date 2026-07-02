import { describe, it, expect } from "vitest";
import type { ReactNode } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryStore, type Observation, type LocalStore } from "@healthtwin/core";
import { HealthTwinProvider } from "./HealthTwinProvider";
import { Timeline } from "./Timeline";
import { BodyMapReview } from "./BodyMapReview";

const mk = (id: string, over: Partial<Observation>): Observation => ({
  id, subjectId: "s", occurredAt: "2026-07-02T10:00:00.000Z", createdAt: "2026-07-02T10:00:00.000Z",
  location: { regionId: "knee", side: "left", view: "anterior" }, type: "pain",
  taxonomyVersion: "1.0.0", origin: "d", ...over,
});

async function seeded(children: ReactNode, records: Observation[]) {
  const store: LocalStore = createMemoryStore();
  for (const r of records) await store.append(r);
  return render(
    <HealthTwinProvider store={store} subjectId="s" origin="d">{children}</HealthTwinProvider>,
  );
}

describe("review surfaces", () => {
  it("timeline groups entries by day", async () => {
    await seeded(<Timeline />, [
      mk("A".repeat(26), { occurredAt: "2026-07-01T09:00:00.000Z" }),
      mk("B".repeat(26), { occurredAt: "2026-07-02T09:00:00.000Z" }),
    ]);
    await waitFor(() => expect(screen.getAllByTestId("timeline-entry")).toHaveLength(2));
    expect(screen.getByText("2026-07-02")).toBeDefined();
    expect(screen.getByText("2026-07-01")).toBeDefined();
  });

  it("review renders a metric switcher and toggles selection", async () => {
    await seeded(<BodyMapReview view="anterior" />, [mk("A".repeat(26), {})]);
    await waitFor(() => expect(screen.getByLabelText("frequency")).toBeDefined());
    await userEvent.click(screen.getByLabelText("recency"));
    expect((screen.getByLabelText("recency") as HTMLInputElement).checked).toBe(true);
  });
});
