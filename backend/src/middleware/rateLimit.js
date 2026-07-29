/**
 * Per-user sliding-window limiter. In-memory and per-process, which is the
 * right size for this app — it exists so one account can't drain the FASHN
 * credit balance, not to be a distributed quota system.
 *
 * Must be mounted after requireAuth (it keys on req.userId).
 */
export function rateLimit({ limit, windowMs, message }) {
  const hits = new Map(); // userId -> number[] of timestamps

  return function limiter(req, res, next) {
    const key = req.userId || req.ip;
    const now = Date.now();
    const recent = (hits.get(key) || []).filter((t) => now - t < windowMs);

    if (recent.length >= limit) {
      const retryAfterSec = Math.ceil((windowMs - (now - recent[0])) / 1000);
      hits.set(key, recent);
      res.set("Retry-After", String(retryAfterSec));
      return res.status(429).json({ error: message, code: "rate_limit", retryAfterSec });
    }

    recent.push(now);
    hits.set(key, recent);

    // Cheap opportunistic prune so idle users don't accumulate forever.
    if (hits.size > 500) {
      for (const [k, times] of hits) {
        if (times.every((t) => now - t >= windowMs)) hits.delete(k);
      }
    }
    next();
  };
}
