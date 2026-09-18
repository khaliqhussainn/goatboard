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

/**
 * Best-effort real client IP for rate limiting - never treat this as a
 * verified identity, only as a secondary abuse signal (multiple genuine
 * visitors can share one IP, e.g. behind NAT or a mobile carrier).
 *
 * Deliberately does NOT trust the first hop of a client-supplied
 * X-Forwarded-For: any caller hitting this API directly can set that header
 * to whatever they like, which would make IP-based rate limiting trivially
 * bypassable. Platform-set headers that a proxy overwrites on every request
 * (rather than merely appending to) are checked first instead, since those
 * can't be spoofed by the client that reaches this process.
 */
export function getClientIp(headers: Headers): string {
  // Vercel's edge sets this itself on every request that reaches your
  // function - a client-supplied value never survives it.
  const vercelIp = headers.get("x-vercel-forwarded-for");
  if (vercelIp) return vercelIp.split(",")[0].trim();

  // Same idea on Cloudflare.
  const cfIp = headers.get("cf-connecting-ip");
  if (cfIp) return cfIp.trim();

  // Last resort: the final hop of X-Forwarded-For. A client can prepend
  // whatever it wants to the front of this header, but on a typical proxy
  // chain the LAST entry is the one appended by whatever sits immediately in
  // front of this process, not something the original caller controls. Not
  // guaranteed on every deployment topology, which is exactly why this
  // function's result only ever feeds a rate limit, never a vote decision.
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const hops = forwarded
      .split(",")
      .map((hop) => hop.trim())
      .filter(Boolean);
    if (hops.length > 0) return hops[hops.length - 1];
  }

  return headers.get("x-real-ip")?.trim() || "unknown";
}
