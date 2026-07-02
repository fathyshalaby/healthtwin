import { describe, it, expect } from "vitest";
import { newId, nowISO } from "./ids";

describe("ids", () => {
  it("newId returns a 26-char ULID", () => {
    expect(newId()).toMatch(/^[0-9A-HJKMNP-TV-Z]{26}$/);
  });
  it("nowISO returns an ISO-8601 UTC string", () => {
    expect(nowISO()).toMatch(/^\d{4}-\d{2}-\d{2}T.*Z$/);
  });
});
