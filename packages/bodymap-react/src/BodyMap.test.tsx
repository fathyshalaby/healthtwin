import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { BodyMap } from "./BodyMap";

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
    // Left Knee is ell(87, 272, 12, 13) → bbox x 75..99, y 259..285; (95, 272) is right-of-centre.
    fireEvent.click(screen.getByLabelText("Left Knee"), at(95, 272));
    const sel = onSelect.mock.calls[0][0];
    expect(sel.key).toBe("knee:left:anterior");
    expect(sel.point.x).toBeCloseTo(20 / 24, 5);
    expect(sel.point.y).toBeCloseTo(0.5, 5);
  });

  it("sends a near-miss tap to the nearest region, and a far one nowhere", () => {
    const onSelect = vi.fn();
    const { container } = render(<BodyMap view="anterior" onSelect={onSelect} />);
    const at = layout(container.querySelector("svg")!);
    const catcher = container.querySelector(".ht-catch")!;
    fireEvent.click(catcher, at(37, 204)); // 3 units off the left hand
    expect(onSelect).toHaveBeenLastCalledWith(expect.objectContaining({ key: "hand:left:anterior" }));
    onSelect.mockClear();
    fireEvent.click(catcher, at(5, 5)); // nothing within the pad
    expect(onSelect).not.toHaveBeenCalled();
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
