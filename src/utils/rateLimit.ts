/**
 * IN-MEMORY RATE LIMITER
 * ===========================================================================
 * A pragmatic first line of defence against form abuse.
 *
 * LIMITATION — READ BEFORE RELYING ON THIS
 * Serverless functions do not share memory and instances are recycled, so this
 * limiter is best-effort only. It will stop naive scripted floods hitting a
 * warm instance; it will not stop a distributed attack.
 *
 * For production, layer on one of:
 *   - Vercel WAF / rate limiting rules on the /api/lead path (simplest);
 *   - Upstash Redis or Vercel KV with a shared counter (swap `hit()` below);
 *   - Cloudflare Turnstile or reCAPTCHA v3 as a scoring signal.
 *
 * The honeypot field and the minimum fill-time check in /api/lead run
 * regardless of this limiter.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();
const MAX_KEYS = 5000;

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

export function hit(key: string, max: number, windowSeconds: number): RateLimitResult {
  const now = Date.now();
  const windowMs = windowSeconds * 1000;

  // Opportunistic cleanup so the map cannot grow without bound.
  if (buckets.size > MAX_KEYS) {
    for (const [k, b] of buckets) {
      if (b.resetAt <= now) buckets.delete(k);
    }
  }

  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: max - 1, retryAfterSeconds: 0 };
  }

  existing.count += 1;
  const allowed = existing.count <= max;
  return {
    allowed,
    remaining: Math.max(0, max - existing.count),
    retryAfterSeconds: allowed ? 0 : Math.ceil((existing.resetAt - now) / 1000),
  };
}

/** Best-available client identifier behind Vercel's proxy. */
export function clientKey(request: Request): string {
  const headers = request.headers;
  const forwarded = headers.get('x-forwarded-for');
  const ip =
    headers.get('x-real-ip') || (forwarded ? forwarded.split(',')[0]!.trim() : '') || 'unknown';
  return ip;
}
