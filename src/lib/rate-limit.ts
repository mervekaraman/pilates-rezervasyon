import "server-only";

// Small in-memory limiter for login and reset attempts. It is per server instance, which is enough
// to slow down guessing on a single-studio app; a shared store (e.g. Redis) would replace it at scale.
const buckets = new Map<string, { count: number; resetAt: number }>();

export function hitRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }
  bucket.count += 1;
  return bucket.count > limit;
}

export function clearRateLimit(key: string) {
  buckets.delete(key);
}
