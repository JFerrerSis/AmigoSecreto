import { LocalApiError } from "@/lib/local/errors";
import { getClientIp } from "@/lib/security/request";

interface RateLimitOptions {
  scope: string;
  limit: number;
  windowMs: number;
  key?: string;
}

interface RateLimitBucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, RateLimitBucket>();
const MAX_BUCKETS = 5000;

function pruneExpired(now: number) {
  if (buckets.size <= MAX_BUCKETS) return;

  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export function enforceRateLimit(
  request: Request,
  options: RateLimitOptions,
) {
  const now = Date.now();
  const key = `${options.scope}:${options.key ?? getClientIp(request)}`;
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    pruneExpired(now);
    buckets.set(key, { count: 1, resetAt: now + options.windowMs });
    return;
  }

  if (bucket.count >= options.limit) {
    throw new LocalApiError(
      "Demasiadas solicitudes. Espera un momento e inténtalo de nuevo.",
      429,
      "RATE_LIMITED",
    );
  }

  bucket.count += 1;
}
