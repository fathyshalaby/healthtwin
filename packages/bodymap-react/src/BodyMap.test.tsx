import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
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
});
