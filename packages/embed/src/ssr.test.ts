/**
 * @vitest-environment node
 */
import { describe, it, expect } from "vitest";

describe("embed SSR", () => {
  it("imports without HTMLElement (Next.js server)", async () => {
    expect(typeof HTMLElement).toBe("undefined");
    const mod = await import("./embedElement");
    expect(mod.HealthTwinCaptureElement).toBeDefined();
    expect(() => mod.defineHealthTwinCapture()).not.toThrow();
  });
});
