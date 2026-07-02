import { describe, it, expect, vi } from "vitest";
import { waitFor } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import { createMemoryStore, type Observation } from "@healthtwin/core";
import { defineHealthTwinCapture, HealthTwinCaptureElement } from "./embedElement";

async function mountAndCapture(el: HealthTwinCaptureElement) {
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
}

describe("<health-twin-capture>", () => {
  it("mounts a body map and emits an event on capture", async () => {
    defineHealthTwinCapture();
    const el = document.createElement("health-twin-capture") as HealthTwinCaptureElement;
    el.store = createMemoryStore();
    const events: Observation[] = [];
    el.addEventListener("healthtwin:observation", (e) => events.push((e as CustomEvent<Observation>).detail));

    await mountAndCapture(el);

    await waitFor(() => expect(events).toHaveLength(1));
    expect(events[0].location.regionId).toBe("knee");
    el.remove();
  });

  it("posts to the configured allowed-origin, never '*'", async () => {
    defineHealthTwinCapture();
    const el = document.createElement("health-twin-capture") as HealthTwinCaptureElement;
    el.store = createMemoryStore();
    el.setAttribute("allowed-origin", "https://partner.example");
    const spy = vi.spyOn(window.parent, "postMessage");

    await mountAndCapture(el);

    await waitFor(() => expect(spy).toHaveBeenCalled());
    const [, targetOrigin] = spy.mock.calls[0];
    expect(targetOrigin).toBe("https://partner.example");
    expect(targetOrigin).not.toBe("*");
    spy.mockRestore();
    el.remove();
  });
});
