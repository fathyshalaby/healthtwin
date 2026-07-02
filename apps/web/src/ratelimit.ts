import { NextResponse } from "next/server";
import { createRateLimiter } from "@healthtwin/ratelimit";

// Best-effort per-instance limiter (60 req/min). For multi-instance serverless,
// back createRateLimiter with a shared store (Redis/Postgres).
const limiter = createRateLimiter({ limit: 60, windowMs: 60_000 });

export function rateKey(req: Request, token: string | null): string {
  return token ?? req.headers.get("x-forwarded-for") ?? "anon";
}

/** Returns a 429 response when the key is over the limit, else null. */
export async function rateLimited(key: string): Promise<NextResponse | null> {
  const { allowed, remaining, resetAt } = await limiter.check(key);
  if (allowed) return null;
  return NextResponse.json(
    { error: "rate limited" },
    {
      status: 429,
      headers: {
        "retry-after": String(Math.max(1, Math.ceil((resetAt - Date.now()) / 1000))),
        "x-ratelimit-remaining": String(remaining),
      },
    },
  );
}
