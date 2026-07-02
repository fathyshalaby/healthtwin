import { describe, it, expect } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryStore, type LocalStore } from "@healthtwin/core";
import { HealthTwinProvider } from "./HealthTwinProvider";
import { BodyMapCapture } from "./BodyMapCapture";

function wrap(store: LocalStore) {
  return render(
    <HealthTwinProvider store={store} subjectId="s" origin="d">
      <BodyMapCapture view="anterior" />
    </HealthTwinProvider>,
  );
}

describe("BodyMapCapture", () => {
  it("captures an observation end to end", async () => {
    const store = createMemoryStore();
    wrap(store);
    await userEvent.click(screen.getByLabelText("Left Knee"));  // opens sheet
    await userEvent.click(await screen.findByRole("button", { name: "Save" }));
    await waitFor(async () => expect((await store.all()).length).toBe(1));
    const saved = (await store.all())[0];
    expect(saved.location.regionId).toBe("knee");
  });
});
