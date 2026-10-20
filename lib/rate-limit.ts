/**
 * lib/rate-limit.ts
 *
 * Simple in-process rate limiter using a sliding window counter.
 * Works on Vercel serverless (each cold-start resets the counter,
 * but that's fine — this stops burst abuse within a single instance).
 *
 * For production at scale, swap the Map for a Redis/Upstash store.
 */

interface Window {
  count: number;
  resetAt: number; // epoch ms
}

// Module-level store (shared across requests in the same serverless instance)
const store = new Map<string, Window>();

/**
 * Check if the given key is within its rate limit.
 *
 * @param key      - Unique identifier (IP address, user ID, etc.)
 * @param limit    - Max requests allowed per window
 * @param windowMs - Window length in milliseconds
 * @returns { allowed: boolean; remaining: number; resetAt: number }
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const existing = store.get(key);

  if (!existing || now >= existing.resetAt) {
    // Start a fresh window
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetAt: now + windowMs };
  }

  if (existing.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: existing.resetAt };
  }

  existing.count += 1;
  return {
    allowed: true,
    remaining: limit - existing.count,
    resetAt: existing.resetAt,
  };
}

/**
 * Extract the real client IP from a Next.js Request.
 * Checks standard proxy headers before falling back to a constant.
 */
export function getClientIp(request: Request): string {
  const headers = [
    "x-forwarded-for",
    "x-real-ip",
    "cf-connecting-ip", // Cloudflare
    "x-client-ip",
  ];
  for (const header of headers) {
    const val = request.headers.get(header);
    if (val) {
      // x-forwarded-for may be "client, proxy1, proxy2" — take the first
      return val.split(",")[0].trim();
    }
  }
  return "unknown";
}
