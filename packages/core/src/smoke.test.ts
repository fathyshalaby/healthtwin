import { describe, it, expect } from "vitest";
import { hello } from "./index";

describe("scaffold", () => {
  it("exports a hello marker", () => {
    expect(hello()).toBe("healthtwin");
  });
});
