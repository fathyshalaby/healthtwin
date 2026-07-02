import { describe, it, expect } from "vitest";
import { createMemoryStore } from "./store";
import type { Observation } from "./types";

const rec: Observation = {
  id: "A".repeat(26), subjectId: "s", occurredAt: "2026-07-02T10:00:00.000Z",
  createdAt: "2026-07-02T10:00:00.000Z", location: { regionId: "knee", side: "left", view: "anterior" },
  type: "pain", taxonomyVersion: "1.0.0", origin: "d",
};

describe("memory store", () => {
  it("appends and returns records", async () => {
    const s = createMemoryStore();
    expect(await s.all()).toEqual([]);
    await s.append(rec);
    expect(await s.all()).toEqual([rec]);
  });
});
