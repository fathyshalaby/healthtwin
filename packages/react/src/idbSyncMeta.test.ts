import { describe, it, expect } from "vitest";
import { createIdbSyncMeta } from "./idbSyncMeta";

describe("idb sync meta", () => {
  it("persists cursor and synced ids", async () => {
    const m = createIdbSyncMeta("sync-test-1");
    expect(await m.getCursor()).toBeUndefined();

    await m.setCursor("42");
    expect(await m.getCursor()).toBe("42");

    await m.markSynced(["A".repeat(26), "B".repeat(26)]);
    const ids = [...(await m.syncedIds())].sort();
    expect(ids).toEqual(["A".repeat(26), "B".repeat(26)]);
  });
});
