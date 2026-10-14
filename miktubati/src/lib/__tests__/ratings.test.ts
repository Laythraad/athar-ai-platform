import { describe, it, expect } from "vitest";
import {
  computeRatingSummary, canRate, upsertRating,
  checkRateLimit, resetRateLimiter, RATE_RULES, PRIOR_MEAN, PRIOR_WEIGHT,
} from "../ratings";

describe("computeRatingSummary", () => {
  it("returns zeros for no ratings", () => {
    expect(computeRatingSummary([])).toEqual({ displayAvg: 0, rawAvg: 0, count: 0 });
  });

  it("computes a plain average for a single rating but a dampened display average", () => {
    const s = computeRatingSummary([5]);
    expect(s.count).toBe(1);
    expect(s.rawAvg).toBe(5);
    // weighted: (5*3.5 + 5) / (5+1) = 22.5/6 = 3.75 → 3.8
    expect(s.displayAvg).toBe(3.8);
    expect(s.displayAvg).toBeLessThan(s.rawAvg);
  });

  it("a single 5★ cannot dominate — display avg stays below raw avg", () => {
    const one = computeRatingSummary([5]);
    expect(one.displayAvg).toBeLessThan(one.rawAvg);
  });

  it("a single 1★ is also dampened toward the prior", () => {
    const s = computeRatingSummary([1]);
    expect(s.rawAvg).toBe(1);
    expect(s.displayAvg).toBeGreaterThan(1);
  });

  it("converges toward the raw average as votes grow", () => {
    const many = Array(50).fill(5) as number[];
    const s = computeRatingSummary(many);
    expect(s.count).toBe(50);
    expect(s.rawAvg).toBe(5);
    // The prior still dampens a little at n=50, but the gap shrinks as n grows.
    expect(s.displayAvg).toBeGreaterThan(4.8);
    expect(s.displayAvg).toBeLessThan(5);
    const huge = Array(5000).fill(5) as number[];
    expect(computeRatingSummary(huge).displayAvg).toBe(5);
  });

  it("ignores out-of-range values", () => {
    const s = computeRatingSummary([6, 0, -1, 3, 4]);
    expect(s.count).toBe(2);
    expect(s.rawAvg).toBe(3.5);
  });

  it("prior constants are sane", () => {
    expect(PRIOR_MEAN).toBeGreaterThanOrEqual(1);
    expect(PRIOR_MEAN).toBeLessThanOrEqual(5);
    expect(PRIOR_WEIGHT).toBeGreaterThan(0);
  });
});

describe("canRate", () => {
  it("blocks self-rating", () => {
    const r = canRate("u1", "u1");
    expect(r.ok).toBe(false);
    expect(r.reason).toBe("self_rating");
  });

  it("allows rating another author", () => {
    expect(canRate("u1", "u2").ok).toBe(true);
  });

  it("blocks missing ids", () => {
    expect(canRate("", "u2").ok).toBe(false);
  });
});

describe("upsertRating", () => {
  it("adds a new rating", () => {
    const out = upsertRating([], "a1", "r1", 4);
    expect(out).toHaveLength(1);
    expect(out[0].stars).toBe(4);
  });

  it("duplicate rating UPDATES rather than adds", () => {
    let list = upsertRating([], "a1", "r1", 4);
    list = upsertRating(list, "a1", "r1", 2);
    expect(list).toHaveLength(1);
    expect(list[0].stars).toBe(2);
  });

  it("keeps separate raters separate", () => {
    let list = upsertRating([], "a1", "r1", 4);
    list = upsertRating(list, "a1", "r2", 5);
    expect(list).toHaveLength(2);
  });

  it("throws on invalid stars", () => {
    expect(() => upsertRating([], "a1", "r1", 6)).toThrow(RangeError);
    expect(() => upsertRating([], "a1", "r1", 0)).toThrow(RangeError);
    expect(() => upsertRating([], "a1", "r1", 3.5)).toThrow(RangeError);
  });
});

describe("checkRateLimit", () => {
  it("allows up to the limit then blocks", () => {
    resetRateLimiter();
    const rule = RATE_RULES.rating;
    const now = 1_000_000;
    for (let i = 0; i < rule.limit; i++) {
      expect(checkRateLimit("u1", rule, now).allowed).toBe(true);
    }
    const blocked = checkRateLimit("u1", rule, now);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterMs).toBeGreaterThan(0);
  });

  it("resets after the window", () => {
    resetRateLimiter();
    const rule = RATE_RULES.rating;
    const now = 1_000_000;
    for (let i = 0; i < rule.limit; i++) checkRateLimit("u1", rule, now);
    expect(checkRateLimit("u1", rule, now).allowed).toBe(false);
    expect(checkRateLimit("u1", rule, now + rule.windowMs + 1).allowed).toBe(true);
  });

  it("does not block a different key", () => {
    resetRateLimiter();
    const rule = RATE_RULES.rating;
    const now = 1_000_000;
    for (let i = 0; i < rule.limit; i++) checkRateLimit("u1", rule, now);
    expect(checkRateLimit("u1", rule, now).allowed).toBe(false);
    expect(checkRateLimit("u2", rule, now).allowed).toBe(true);
  });
});
