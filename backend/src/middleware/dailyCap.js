import { config } from "../config.js";

/**
 * Whole-deployment ceiling on generations per UTC day.
 *
 * The per-user limiter stops one account draining the FASHN credit balance;
 * this stops every account together doing it. Sign-up is invite-gated, so this
 * is the second line rather than the first — it exists for the day a code gets
 * shared further than intended.
 *
 * In-memory and per-process on purpose. It resets on restart, and a free-tier
 * container that spins down when idle effectively resets it too. That is
 * accepted: the invite gate is the real control, and a counter that needs its
 * own datastore would cost more than it protects.
 */
export function dailyCap() {
  let day = "";
  let used = 0;

  return function capped(req, res, next) {
    if (!config.tryonDailyGlobalCap) return next();

    const today = new Date().toISOString().slice(0, 10);
    if (today !== day) {
      day = today;
      used = 0;
    }

    if (used >= config.tryonDailyGlobalCap) {
      // Same shape as the per-user limiter so the client's existing rate_limit
      // handling covers it with no new branch.
      const midnight = Date.parse(`${today}T24:00:00Z`);
      const retryAfterSec = Math.max(1, Math.ceil((midnight - Date.now()) / 1000));
      res.set("Retry-After", String(retryAfterSec));
      return res.status(429).json({
        error: "Today's try-on allowance for this demo is used up. Try again tomorrow.",
        code: "rate_limit",
        retryAfterSec,
      });
    }

    used += 1;
    next();
  };
}
