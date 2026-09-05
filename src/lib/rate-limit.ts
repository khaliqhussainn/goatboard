import "server-only";

/**
 * Minimal in-memory sliding-window rate limiter, keyed per server instance.
 * Good enough for a single-region deployment; swap for Upstash Redis (or
 * similar) if you deploy multiple instances/regions behind Vercel.
 */
const buckets = new Map<string, number[]>();

const MAX_BUCKETS = 50_000;

export function rateLimit(
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number },
): { success: boolean; remaining: number } {
  const now = Date.now();
  const windowStart = now - windowMs;

  if (buckets.size > MAX_BUCKETS) {
    buckets.clear();
  }

  const hits = (buckets.get(key) ?? []).filter((t) => t > windowStart);
  hits.push(now);
  buckets.set(key, hits);

  return { success: hits.length <= limit, remaining: Math.max(0, limit - hits.length) };
}

export function getClientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return headers.get("x-real-ip") ?? "unknown";
}
