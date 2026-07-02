import { describe, it, expect } from "vitest";
import { queryObservations } from "./query";
import type { Observation } from "./types";

const mk = (id: string, over: Partial<Observation>): Observation => ({
  id, subjectId: "s", occurredAt: "2026-07-02T10:00:00.000Z", createdAt: "2026-07-02T10:00:00.000Z",
  location: { regionId: "knee", side: "left", view: "anterior" }, type: "pain",
  taxonomyVersion: "1.0.0", origin: "d", ...over,
});

describe("queryObservations", () => {
  const rows = [
    mk("a", { occurredAt: "2026-07-01T10:00:00.000Z", location: { regionId: "knee", side: "left", view: "anterior" } }),
    mk("b", { occurredAt: "2026-07-03T10:00:00.000Z", location: { regionId: "chest", side: "central", view: "anterior" }, type: "stiffness" }),
  ];
  it("returns all sorted by occurredAt desc when no filter", () => {
    expect(queryObservations(rows).map((o) => o.id)).toEqual(["b", "a"]);
  });
  it("filters by regionId", () => {
    expect(queryObservations(rows, { regionId: "chest" }).map((o) => o.id)).toEqual(["b"]);
  });
  it("filters by date range (inclusive)", () => {
    expect(queryObservations(rows, { from: "2026-07-02T00:00:00.000Z" }).map((o) => o.id)).toEqual(["b"]);
  });
});
