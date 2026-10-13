import { describe, it, expect, vi, afterEach } from "vitest";
import { render } from "@testing-library/react";
import { CorrelationView } from "./CorrelationView";
import type { Observation } from "@healthtwin/core";
import { createSample } from "@healthtwin/vitals";

let seq = 0;
const obs = (day: string, intensity: number): Observation => ({
  id: String(seq++).padStart(26, "A"), subjectId: "u1",
  occurredAt: `${day}T10:00:00.000Z`, createdAt: `${day}T10:00:00.000Z`,
  location: { regionId: "knee", side: "left", view: "anterior" },
  type: "pain", intensity, taxonomyVersion: "1.1.0", origin: "d",
});
const sleep = (day: string, min: number) =>
  createSample({ kind: "sleep_minutes", value: min, unit: "min", at: `${day}T23:00:00.000Z` }, { subjectId: "u1" });

describe("CorrelationView", () => {
  it("reports the correlation strength and coefficient", () => {
    const observations = [obs("2026-07-01", 2), obs("2026-07-02", 4), obs("2026-07-03", 6)];
    const samples = [sleep("2026-07-01", 300), sleep("2026-07-02", 400), sleep("2026-07-03", 500)];
    const { container } = render(<CorrelationView observations={observations} samples={samples} kind="sleep_minutes" />);
    expect(container.textContent).toMatch(/strong direct correlation/i);
    expect(container.textContent).toContain("r = 1.00");
  });

  it("explains when there isn't enough overlap", () => {
    const { container } = render(
      <CorrelationView observations={[obs("2026-07-05", 5)]} samples={[sleep("2026-07-05", 300)]} kind="sleep_minutes" />,
    );
    expect(container.textContent).toMatch(/not enough overlapping days/i);
  });

  it("survives flipping between 'not enough data' and a real correlation (hook order)", () => {
    const few = { observations: [obs("2026-07-05", 5)], samples: [sleep("2026-07-05", 300)] };
    const enough = {
      observations: [obs("2026-07-01", 2), obs("2026-07-02", 4), obs("2026-07-03", 6)],
      samples: [sleep("2026-07-01", 300), sleep("2026-07-02", 400), sleep("2026-07-03", 500)],
    };
    const { container, rerender } = render(<CorrelationView {...few} kind="sleep_minutes" />);
    expect(container.textContent).toMatch(/not enough overlapping days/i);
    // Same instance, now with data: adds hooks-after-return would throw "Rendered more hooks".
    rerender(<CorrelationView {...enough} kind="sleep_minutes" />);
    expect(container.textContent).toMatch(/strong direct correlation/i);
    rerender(<CorrelationView {...few} kind="sleep_minutes" />);
    expect(container.textContent).toMatch(/not enough overlapping days/i);
  });

  describe("responsive width", () => {
    afterEach(() => vi.unstubAllGlobals());

    it("observes the chart wrapper even when it only appears after a re-render", () => {
      const observed: Element[] = [];
      class FakeRO {
        constructor(_cb: ResizeObserverCallback) {}
        observe(el: Element) { observed.push(el); }
        disconnect() {}
        unobserve() {}
      }
      vi.stubGlobal("ResizeObserver", FakeRO);

      const few = { observations: [obs("2026-07-05", 5)], samples: [sleep("2026-07-05", 300)] };
      const enough = {
        observations: [obs("2026-07-01", 2), obs("2026-07-02", 4), obs("2026-07-03", 6)],
        samples: [sleep("2026-07-01", 300), sleep("2026-07-02", 400), sleep("2026-07-03", 500)],
      };
      const { container, rerender } = render(<CorrelationView {...few} kind="sleep_minutes" />);
      expect(observed).toHaveLength(0); // nothing to measure yet
      rerender(<CorrelationView {...enough} kind="sleep_minutes" />);
      expect(observed).toHaveLength(1);
      expect(observed[0]).toBe(container.querySelector(".corr-wrap"));
    });
  });
});
