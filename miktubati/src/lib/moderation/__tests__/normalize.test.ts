import { describe, it, expect } from "vitest";
import {
  stripDiacritics,
  collapseElongation,
  stripInvisible,
  normalizeAlef,
  normalizeArabic,
  despace,
  translitToArabic,
} from "../normalize";

describe("normalizeArabic", () => {
  it("removes diacritics (tashkeel)", () => {
    expect(normalizeArabic("كَتَبَ")).toBe("كتب");
  });

  it("removes tatweel / kashida", () => {
    expect(normalizeArabic("كتـــاب")).toBe("كتاب");
  });

  it("collapses letter elongation", () => {
    expect(normalizeArabic("خخخخي")).toBe("خي");
    expect(collapseElongation("ااااا")).toBe("ا");
  });

  it("removes zero-width and invisible characters", () => {
    expect(stripInvisible("ك\u200Bت\u200Eاب")).toBe("كتاب");
    expect(normalizeArabic("ك\u200Bتاب")).toBe("كتاب");
  });

  it("normalises alef variants to bare alef", () => {
    expect(normalizeAlef("أإآٱ")).toBe("AAAA".replace(/A/g, "ا"));
    expect(normalizeArabic("إسلام")).toBe("اسلام");
    expect(normalizeArabic("إسماعيل")).toBe("اسماعيل");
  });

  it("normalises alef maqsura to yaa", () => {
    expect(normalizeArabic("مصطفى")).toBe("مصطفي");
  });

  it("strips diacritics helper works on its own", () => {
    expect(stripDiacritics("مُحَمَّد")).toBe("محمد");
  });

  it("despaces to defeat spacing attacks", () => {
    // "ا ل ك س" despaces to "الكس", which CONTAINS the term "كس" — so the
    // rule layer still catches it even though spaces were inserted.
    expect(despace("ا ل ك س")).toBe("الكس");
    expect(despace("ا ل ك س")).toContain("كس");
    expect(despace("هنا ك س هنا")).toContain("كس");
  });

  it("transliterates Latin look-alike spellings back to Arabic", () => {
    expect(translitToArabic("ks")).toBe("كس");
    expect(translitToArabic("zani")).toBe("زاني");
    expect(translitToArabic("zani")).toContain("ن");
  });

  it("collapses whitespace runs", () => {
    expect(normalizeArabic("  مرحبًا   بك  ")).toBe("مرحبا بك");
  });
});
