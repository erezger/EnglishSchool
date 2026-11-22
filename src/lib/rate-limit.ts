// Minimal in-memory fixed-window limiter (single app instance is enough here).
const buckets = new Map<string, { count: number; resetAt: number }>();

/** Returns true if the call is allowed. */
export function allow(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    if (buckets.size > 10_000) prune(now);
    return true;
  }
  bucket.count += 1;
  return bucket.count <= limit;
}

function prune(now: number) {
  for (const [key, b] of buckets) if (b.resetAt <= now) buckets.delete(key);
}
