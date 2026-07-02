import { describe, it, expect, vi, afterEach } from "vitest";
import { exchangePartnerToken } from "./tokenExchange";

afterEach(() => { vi.unstubAllGlobals(); });

describe("exchangePartnerToken", () => {
  it("posts the partner token and returns the session", async () => {
    const fetchMock = vi.fn(async () => ({ ok: true, json: async () => ({ token: "sess", subjectId: "u1" }) }));
    vi.stubGlobal("fetch", fetchMock);

    const res = await exchangePartnerToken("https://api.healthtwin.dev/exchange", "ptoken");

    expect(res).toEqual({ token: "sess", subjectId: "u1" });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.healthtwin.dev/exchange",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("throws on a non-ok response", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, status: 401 })));
    await expect(exchangePartnerToken("https://api/x", "t")).rejects.toThrow(/401/);
  });
});
