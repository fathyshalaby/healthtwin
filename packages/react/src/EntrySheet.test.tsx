import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EntrySheet } from "./EntrySheet";

describe("EntrySheet", () => {
  it("submits a NewObservation for the region, including intensity and an ISO occurredAt", async () => {
    const onSubmit = vi.fn();
    render(
      <EntrySheet regionId="knee" regionLabel="Left Knee" side="left" view="anterior"
        point={{ x: 0.5, y: 0.5 }} onSubmit={onSubmit} onCancel={() => {}} />,
    );
    await userEvent.selectOptions(screen.getByLabelText("Type"), "pain");
    fireEvent.change(screen.getByLabelText("Intensity"), { target: { value: "7" } });
    await userEvent.type(screen.getByLabelText("Note"), "sore after PT");
    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "pain",
        intensity: 7,
        note: "sore after PT",
        location: { regionId: "knee", side: "left", view: "anterior", point: { x: 0.5, y: 0.5 } },
        occurredAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T.*Z$/),
      }),
    );
  });

  it("renders an editable time control", () => {
    render(
      <EntrySheet regionId="knee" regionLabel="Left Knee" side="left" view="anterior"
        onSubmit={() => {}} onCancel={() => {}} />,
    );
    expect(screen.getByLabelText("Time")).toBeDefined();
  });
});
