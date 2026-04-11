// @ts-nocheck -- template-only; the scaffold engine strips this line before writing to user projects so scaffolded output has normal TypeScript checking.
import 'server-only';

// Minimal rate limiter for {{projectName}}.
//
// Dev default: in-memory LRU keyed by client identifier. Fine for local
// development and single-instance deploys. For production on Vercel or
// any multi-instance runtime, swap this out for an Upstash-backed
// adapter (see https://upstash.com/docs/redis/sdks/ratelimit-ts). The
// surface area — `rateLimit(key)` returning { success, remaining } —
// is compatible with @upstash/ratelimit so the swap is one import away.
//
// The in-memory map uses a 1-minute sliding window by default.

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 60;

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
}

export async function rateLimit(key: string): Promise<RateLimitResult> {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    const fresh: Bucket = { count: 1, resetAt: now + WINDOW_MS };
    buckets.set(key, fresh);
    return { success: true, remaining: MAX_REQUESTS - 1, resetAt: fresh.resetAt };
  }
  bucket.count += 1;
  if (bucket.count > MAX_REQUESTS) {
    return { success: false, remaining: 0, resetAt: bucket.resetAt };
  }
  return { success: true, remaining: MAX_REQUESTS - bucket.count, resetAt: bucket.resetAt };
}

// Opportunistic cleanup: called by long-lived processes to drop expired
// buckets. No-op if not called — Next.js Fluid Compute recycles instances
// often enough that leaks are bounded.
export function sweepExpired(): void {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt < now) buckets.delete(key);
  }
}
