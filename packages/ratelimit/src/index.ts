export interface RateLimitStore {
  hit(key: string, windowMs: number): Promise<{ count: number; resetAt: number }>;
}

export interface RateLimiter {
  check(key: string): Promise<{ allowed: boolean; remaining: number; resetAt: number }>;
}

/**
 * In-memory fixed-window store. Per-instance only — fine for a single process or a
 * best-effort limit; back a shared store (Redis/Postgres) for multi-instance serverless.
 * `now` is injectable for testing.
 */
export function memoryStore(now: () => number = () => Date.now()): RateLimitStore {
  const windows = new Map<string, { count: number; resetAt: number }>();
  return {
    async hit(key, windowMs) {
      const t = now();
      const existing = windows.get(key);
      if (!existing || t >= existing.resetAt) {
        const fresh = { count: 1, resetAt: t + windowMs };
        windows.set(key, fresh);
        return fresh;
      }
      existing.count += 1;
      return existing;
    },
  };
}

export function createRateLimiter(opts: { limit: number; windowMs: number; store?: RateLimitStore }): RateLimiter {
  const store = opts.store ?? memoryStore();
  return {
    async check(key) {
      const { count, resetAt } = await store.hit(key, opts.windowMs);
      return { allowed: count <= opts.limit, remaining: Math.max(0, opts.limit - count), resetAt };
    },
  };
}
