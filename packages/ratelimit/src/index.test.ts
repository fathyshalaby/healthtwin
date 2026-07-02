import { describe, it, expect } from "vitest";
import { createRateLimiter, memoryStore } from "./index";

describe("rate limiter", () => {
  it("allows up to the limit, then blocks, then resets after the window", async () => {
    let t = 1000;
    const rl = createRateLimiter({ limit: 2, windowMs: 100, store: memoryStore(() => t) });

    expect((await rl.check("k")).allowed).toBe(true);   // 1
    expect((await rl.check("k")).allowed).toBe(true);   // 2
    const blocked = await rl.check("k");                // 3 > limit
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);

    t = 1100; // window elapsed
    expect((await rl.check("k")).allowed).toBe(true);   // reset
  });

  it("tracks keys independently", async () => {
    const rl = createRateLimiter({ limit: 1, windowMs: 1000, store: memoryStore(() => 0) });
    expect((await rl.check("a")).allowed).toBe(true);
    expect((await rl.check("b")).allowed).toBe(true);
    expect((await rl.check("a")).allowed).toBe(false);
  });
});
