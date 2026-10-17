/* Star-rating math for authors.
   Pure functions — fully unit-tested, no DB dependency.

   Rules enforced here (and again in RLS + triggers):
   • One rating per (author, rater). A second attempt UPDATES, never adds.
   • No self-rating.
   • The displayed average is a weighted (Bayesian) average so that a single
     5★ cannot drag an author to the top of the list on one vote. */

export const PRIOR_MEAN = 3.5;   // neutral prior
export const PRIOR_WEIGHT = 5;   // "imagine this author already had 5 votes at PRIOR_MEAN"

export interface RatingSummary {
  /** Weighted average shown in the UI (1 decimal). */
  displayAvg: number;
  /** Plain arithmetic average of the actual votes (1 decimal). */
  rawAvg: number;
  count: number;
}

/** Compute the weighted average from a list of star values. */
export function computeRatingSummary(stars: number[]): RatingSummary {
  const valid = stars.filter((s) => Number.isInteger(s) && s >= 1 && s <= 5);
  const count = valid.length;
  if (count === 0) return { displayAvg: 0, rawAvg: 0, count: 0 };

  const sum = valid.reduce((a, b) => a + b, 0);
  const rawAvg = round1(sum / count);
  const weighted = (PRIOR_WEIGHT * PRIOR_MEAN + sum) / (PRIOR_WEIGHT + count);
  return { displayAvg: round1(weighted), rawAvg, count };
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

/** Can `raterId` rate `authorId`? Guards both self-rating and equal ids. */
export function canRate(authorId: string, raterId: string): { ok: boolean; reason?: string } {
  if (!authorId || !raterId) return { ok: false, reason: "missing_id" };
  if (authorId === raterId) return { ok: false, reason: "self_rating" };
  return { ok: true };
}

/** Merge an existing rating with a new one. Duplicate → update, not add. */
export function upsertRating(
  existing: { authorId: string; raterId: string; stars: number }[],
  authorId: string,
  raterId: string,
  stars: number,
): { authorId: string; raterId: string; stars: number }[] {
  if (!Number.isInteger(stars) || stars < 1 || stars > 5) {
    throw new RangeError("stars must be an integer between 1 and 5");
  }
  const i = existing.findIndex((r) => r.authorId === authorId && r.raterId === raterId);
  if (i === -1) {
    return [...existing, { authorId, raterId, stars }];
  }
  const next = existing.slice();
  const prev = next[i]!;
  next[i] = { ...prev, stars };
  return next;
}

/** Very small in-memory sliding-window rate limiter for server routes.
    (Persistence is handled by the rate_events table when Supabase is connected;
     this guard exists so the route is safe even before that.) */
export interface RateLimitRule {
  action: string;
  limit: number;
  windowMs: number;
}

export const RATE_RULES = {
  publish: { action: "publish", limit: 5, windowMs: 60 * 60 * 1000 },
  rating: { action: "rating", limit: 30, windowMs: 60 * 60 * 1000 },
  report: { action: "report", limit: 10, windowMs: 60 * 60 * 1000 },
  moderation: { action: "moderation", limit: 120, windowMs: 60 * 60 * 1000 },
  pen_name_change: { action: "pen_name_change", limit: 3, windowMs: 30 * 24 * 60 * 60 * 1000 },
} as const satisfies Record<string, RateLimitRule>;

const buckets = new Map<string, number[]>();

export function checkRateLimit(
  key: string,
  rule: RateLimitRule | undefined,
  now: number = Date.now(),
): { allowed: boolean; remaining: number; retryAfterMs: number } {
  if (!rule) return { allowed: false, remaining: 0, retryAfterMs: 0 };
  const k = `${key}:${rule.action}`;
  const windowStart = now - rule.windowMs;
  const hits = (buckets.get(k) ?? []).filter((t) => t > windowStart);
  if (hits.length >= rule.limit) {
    const oldest = hits[0] ?? now;
    return { allowed: false, remaining: 0, retryAfterMs: Math.max(0, oldest + rule.windowMs - now) };
  }
  hits.push(now);
  buckets.set(k, hits);
  return { allowed: true, remaining: rule.limit - hits.length, retryAfterMs: 0 };
}

/** Test helper — clear the in-memory limiter between cases. */
export function resetRateLimiter(): void {
  buckets.clear();
}
