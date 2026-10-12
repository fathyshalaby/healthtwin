import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { shapesFor } from "@healthtwin/bodymap-core";
import { BodyMap } from "./BodyMap";

const shape = (key: string) => shapesFor("anterior").find((s) => s.key === key)!;

describe("BodyMap", () => {
  it("renders a labeled region and fires onSelect on click", async () => {
    const onSelect = vi.fn();
    render(<BodyMap view="anterior" onSelect={onSelect} />);
    const knee = screen.getByLabelText("Left Knee");
    await userEvent.click(knee);
    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ key: "knee:left:anterior", regionId: "knee", side: "left" }),
    );
  });

  it("fires onSelect on Enter key", async () => {
    const onSelect = vi.fn();
    render(<BodyMap view="anterior" onSelect={onSelect} />);
    const chest = screen.getByLabelText("Chest");
    chest.focus();
    await userEvent.keyboard("{Enter}");
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ key: "chest:central:anterior" }));
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<BodyMap view="anterior" onSelect={() => {}} />);
    expect(await axe(container)).toHaveNoViolations();
  });

  // Lay the 200×400 viewBox out at 2× with an offset, so client px ≠ SVG units (as in a real page).
  const layout = (svg: SVGSVGElement) => {
    Object.defineProperty(svg, "getScreenCTM", { value: undefined, configurable: true });
    svg.getBoundingClientRect = () => ({ left: 100, top: 50, width: 400, height: 800, right: 500, bottom: 850, x: 100, y: 50, toJSON() {} }) as DOMRect;
    return (ux: number, uy: number) => ({ clientX: 100 + ux * 2, clientY: 50 + uy * 2 });
  };

  it("records where on the region the tap landed, in the region's own 0–1 space", () => {
    const onSelect = vi.fn();
    const { container } = render(<BodyMap view="anterior" onSelect={onSelect} />);
    const at = layout(container.querySelector("svg")!);
    const { bbox } = shape("knee:left:anterior");
    // a point 4 units in from the knee's right edge, halfway down
    fireEvent.click(screen.getByLabelText("Left Knee"), at(bbox.x + bbox.w - 4, bbox.y + bbox.h / 2));
    const sel = onSelect.mock.calls[0][0];
    expect(sel.key).toBe("knee:left:anterior");
    expect(sel.point.x).toBeCloseTo((bbox.w - 4) / bbox.w, 5);
    expect(sel.point.y).toBeCloseTo(0.5, 5);
  });

  it("sends a near-miss tap to the nearest region, and a far one nowhere", () => {
    const onSelect = vi.fn();
    const { container } = render(<BodyMap view="anterior" onSelect={onSelect} />);
    const at = layout(container.querySelector("svg")!);
    const catcher = container.querySelector(".ht-catch")!;
    const hand = shape("hand:left:anterior").bbox;
    fireEvent.click(catcher, at(hand.x - 3, hand.y + hand.h / 2)); // 3 units off the left hand
    expect(onSelect).toHaveBeenLastCalledWith(expect.objectContaining({ key: "hand:left:anterior" }));
    onSelect.mockClear();
    fireEvent.click(catcher, at(5, 5)); // nothing within the pad
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("draws one silhouette with L / R markers, and a spine only from behind", () => {
    const { container, rerender } = render(<BodyMap view="anterior" onSelect={() => {}} />);
    expect(container.querySelectorAll(".ht-outline path")).toHaveLength(shapesFor("anterior").length);
    expect([...container.querySelectorAll(".ht-sides text")].map((t) => t.textContent)).toEqual(["L", "R"]);
    expect(container.querySelector(".ht-spine")).toBeNull();
    // un-shaded regions are borderless — only the silhouette has an edge
    expect(screen.getByLabelText("Left Knee").parentElement!.querySelector(".ht-fill")!.getAttribute("stroke")).toBe("none");
    rerender(<BodyMap view="posterior" onSelect={() => {}} />);
    expect(container.querySelector(".ht-spine")).not.toBeNull();
  });

  it("keyboard (and coordinate-less assistive-tech) activation records the region centre", async () => {
    const onSelect = vi.fn();
    render(<BodyMap view="anterior" onSelect={onSelect} />);
    screen.getByLabelText("Left Knee").focus();
    await userEvent.keyboard("{Enter}");
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ point: { x: 0.5, y: 0.5 } }));
  });

  it("uses exact region shapes — no fat invisible stroke for a neighbour to steal taps with", () => {
    render(<BodyMap view="anterior" onSelect={() => {}} />);
    const knee = screen.getByLabelText("Left Knee");
    expect(knee.getAttribute("stroke-width")).toBeNull();
    expect(knee.getAttribute("fill")).toBe("transparent");
  });
});
