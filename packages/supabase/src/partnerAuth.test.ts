import { describe, it, expect } from "vitest";
import { signPartnerToken, verifyPartnerToken } from "./partnerAuth";

describe("partner token", () => {
  it("round-trips valid claims", () => {
    const t = signPartnerToken({ sub: "u1", partnerId: "colorref" }, "secret");
    expect(verifyPartnerToken(t, "secret")).toMatchObject({ sub: "u1", partnerId: "colorref" });
  });

  it("rejects a wrong-secret / tampered token", () => {
    const t = signPartnerToken({ sub: "u1", partnerId: "p" }, "secret");
    expect(() => verifyPartnerToken(t, "other")).toThrow(/signature/);
  });

  it("rejects an expired token", () => {
    const t = signPartnerToken({ sub: "u1", partnerId: "p", exp: 1 }, "secret");
    expect(() => verifyPartnerToken(t, "secret")).toThrow(/expired/);
  });

  it("rejects missing claims", () => {
    const t = signPartnerToken({ sub: "", partnerId: "" }, "secret");
    expect(() => verifyPartnerToken(t, "secret")).toThrow(/missing/);
  });
});
