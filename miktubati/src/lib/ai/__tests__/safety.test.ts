import { describe, it, expect } from "vitest";
import { detectDanger, emergencyFor, allEmergencies } from "../safety";

describe("detectDanger", () => {
  it("detects an active crisis in English", () => {
    const v = detectDanger("help me someone is trying to kill me right now", { lang: "en" });
    expect(v.danger).toBe(true);
    expect(v.guidance).toBeTruthy();
    // must never claim dispatch
    expect(v.guidance!.toLowerCase()).not.toMatch(/we (have )?sent|dispatched|alerted authorities/);
  });

  it("detects an active crisis in Arabic", () => {
    const v = detectDanger("يوجد مهاجم يطاردني الآن ساعدوني", { lang: "ar" });
    expect(v.danger).toBe(true);
  });

  it("detects country context and attaches guidance", () => {
    const v = detectDanger("someone is attacking me in Baghdad help", { lang: "en" });
    expect(v.danger).toBe(true);
    expect(v.countryIso).toBe("IQ");
    expect(v.guidance).toContain("911");
  });

  it("does NOT flag historical/educational discussion", () => {
    expect(detectDanger("tell me about the fall of the city in the novel", { lang: "en" }).danger).toBe(false);
    expect(detectDanger("في الرواية يهاجم المنذّر بطل القصة", { lang: "ar" }).danger).toBe(false);
    expect(detectDanger("for my essay, what violence existed in Babylonian law?", { lang: "en" }).danger).toBe(false);
  });

  it("does NOT flag ordinary questions", () => {
    expect(detectDanger("what time does the museum open?").danger).toBe(false);
    expect(detectDanger("ما هي أهمية زقورة أور؟", { lang: "ar" }).danger).toBe(false);
  });

  it("uses generic guidance when no country is known", () => {
    const v = detectDanger("help I am being attacked", { lang: "en" });
    expect(v.danger).toBe(true);
    expect(v.countryIso).toBeUndefined();
    expect(v.guidance).toBeTruthy();
  });
});

describe("emergencyFor", () => {
  it("returns Iraq entry with unified 911 and a source", () => {
    const iq = emergencyFor("IQ");
    expect(iq).not.toBeNull();
    expect(iq!.unified).toBe("911");
    expect(iq!.source.length).toBeGreaterThan(5);
    expect(iq!.checked).toMatch(/^\d{4}-\d{2}$/);
  });

  it("is case-insensitive and returns null for unknown ISO", () => {
    expect(emergencyFor("iq")!.country.iso).toBe("IQ");
    expect(emergencyFor("ZZ")).toBeNull();
    expect(emergencyFor(null)).toBeNull();
  });

  it("every entry has a source and verification date", () => {
    for (const e of allEmergencies()) {
      expect(e.source.length).toBeGreaterThan(3);
      expect(e.checked).toMatch(/^\d{4}-\d{2}$/);
      expect(e.country.iso).toMatch(/^[A-Z]{2}$/);
    }
  });
});
