import { describe, it, expect } from "vitest";
import { createIdbStore } from "./idbStore";
import type { Observation } from "@healthtwin/core";

const rec = (id: string): Observation => ({
  id, subjectId: "s", occurredAt: "2026-07-02T10:00:00.000Z", createdAt: "2026-07-02T10:00:00.000Z",
  location: { regionId: "knee", side: "left", view: "anterior" }, type: "pain",
  taxonomyVersion: "1.0.0", origin: "d",
});

describe("idb store", () => {
  it("persists appended records", async () => {
    const s = createIdbStore("test-db-1");
    await s.append(rec("A".repeat(26)));
    await s.append(rec("B".repeat(26)));
    const ids = (await s.all()).map((o) => o.id).sort();
    expect(ids).toEqual(["A".repeat(26), "B".repeat(26)]);
  });
});
