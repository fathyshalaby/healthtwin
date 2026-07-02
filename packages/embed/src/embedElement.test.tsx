import { describe, it, expect } from "vitest";
import { waitFor } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import { createMemoryStore, type Observation } from "@healthtwin/core";
import { defineHealthTwinCapture, HealthTwinCaptureElement } from "./embedElement";

describe("<health-twin-capture>", () => {
  it("mounts a body map and emits an event on capture", async () => {
    defineHealthTwinCapture();
    const el = document.createElement("health-twin-capture") as HealthTwinCaptureElement;
    el.store = createMemoryStore();

    const events: Observation[] = [];
    el.addEventListener("healthtwin:observation", (e) => events.push((e as CustomEvent<Observation>).detail));
    document.body.appendChild(el);

    const knee = await waitFor(() => {
      const k = el.querySelector('[aria-label="Left Knee"]');
      if (!k) throw new Error("body map not mounted yet");
      return k as HTMLElement;
    });
    await userEvent.click(knee);

    const save = await waitFor(() => {
      const b = [...el.querySelectorAll("button")].find((x) => x.textContent === "Save");
      if (!b) throw new Error("entry sheet not open");
      return b;
    });
    await userEvent.click(save);

    await waitFor(() => expect(events).toHaveLength(1));
    expect(events[0].location.regionId).toBe("knee");
    el.remove();
  });
});
