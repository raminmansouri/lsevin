import "server-only";

/**
 * A small in-memory limiter for the public search endpoints. Per-process on purpose: it
 * only has to stop one client from hammering the embedding service, and each pod keeps its
 * own window (so the effective limit is `max` x pods, which is fine for abuse control).
 */
const WINDOW_MS = 60_000;
const hits = new Map<string, { count: number; resetAt: number }>();

export function allow(key: string, max: number): boolean {
  const now = Date.now();
  const entry = hits.get(key);
  if (!entry || entry.resetAt <= now) {
    if (hits.size > 5000) {
      for (const [k, v] of hits) if (v.resetAt <= now) hits.delete(k);
    }
    hits.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  entry.count += 1;
  return entry.count <= max;
}

export function clientKey(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || headers.get("x-real-ip") || "unknown";
}
