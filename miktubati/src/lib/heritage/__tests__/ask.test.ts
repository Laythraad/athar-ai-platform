import { describe, expect, it } from "vitest";
import { retrieveHeritage, askHeritage } from "../ask";

describe("retrieveHeritage", () => {
  it("finds Babylon by Arabic name", () => {
    const r = retrieveHeritage("بابل");
    expect(r.length).toBeGreaterThan(0);
    expect(r[0].id).toBe("iq-babylon");
  });

  it("finds Babylon by English name", () => {
    const r = retrieveHeritage("babylon");
    expect(r.length).toBeGreaterThan(0);
    expect(r[0].id).toBe("iq-babylon");
  });

  it("finds a short English name like Ur", () => {
    const r = retrieveHeritage("Ur ruins");
    expect(r.length).toBeGreaterThan(0);
    expect(r[0].id).toBe("iq-ur-ziggurat");
  });

  it("matches a governorate", () => {
    const r = retrieveHeritage("كربلاء");
    expect(r.length).toBeGreaterThan(0);
    expect(r.some((s) => s.governorate.ar.includes("كربلاء"))).toBe(true);
  });

  it("returns empty for a blank query", () => {
    expect(retrieveHeritage("")).toEqual([]);
    expect(retrieveHeritage("   ")).toEqual([]);
  });

  it("returns empty for gibberish", () => {
    expect(retrieveHeritage("zzzqqqxyzzy")).toEqual([]);
  });

  it("respects the limit", () => {
    expect(retrieveHeritage("العراق", 3).length).toBeLessThanOrEqual(3);
  });
});

describe("askHeritage (no key → safe retrieval fallback)", () => {
  it("answers from the dataset with source=retrieval", async () => {
    const res = await askHeritage("بابل", "ar", { apiKey: "" });
    expect(res.source).toBe("retrieval");
    expect(res.matches.length).toBeGreaterThan(0);
    expect(res.answer).toContain("بابل");
  });

  it("admits when nothing matches instead of inventing", async () => {
    const res = await askHeritage("zzzqqqxyzzy", "ar", { apiKey: "" });
    expect(res.source).toBe("retrieval");
    expect(res.matches).toEqual([]);
    expect(res.answer.length).toBeGreaterThan(0);
  });

  it("localises the answer to English", async () => {
    const res = await askHeritage("Babylon", "en", { apiKey: "" });
    expect(res.answer).toMatch(/found/i);
  });
});
