import type { Context, MiddlewareHandler } from "hono";

interface RateLimitOptions {
  maxAttempts: number;
  windowMs: number;
  now?: () => number;
}

interface Bucket {
  count: number;
  resetAt: number;
}

/** Resolve client IP from reverse-proxy headers or fallback key. */
export function resolveClientIp(c: Context): string {
  const forwarded = c.req.header("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = c.req.header("x-real-ip")?.trim();
  return forwarded || realIp || "local";
}

/** Simple in-memory fixed-window rate limiter per client IP. */
export function createRateLimiter(options: RateLimitOptions): MiddlewareHandler {
  const buckets = new Map<string, Bucket>();
  const getNow = options.now ?? (() => Date.now());

  return async (c, next) => {
    const current = getNow();
    const ip = resolveClientIp(c);
    const existing = buckets.get(ip);

    if (!existing || current >= existing.resetAt) {
      buckets.set(ip, { count: 1, resetAt: current + options.windowMs });
      await next();
      return;
    }

    if (existing.count >= options.maxAttempts) {
      return c.json(
        {
          error: {
            code: "RATE_LIMITED",
            message: "Terlalu banyak percobaan masuk. Coba lagi dalam 1 menit.",
          },
        },
        429,
      );
    }

    existing.count += 1;
    await next();
  };
}
