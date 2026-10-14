import { describe, it, expect } from "vitest";
import { runRules } from "../rules";

describe("rule layer — hard rejects", () => {
  it("rejects plain Arabic profanity", () => {
    const r = runRules({ content: "هذا نص عادي ثم سكس ثم يكمل" });
    expect(r.verdict).toBe("reject");
    expect(r.source).toBe("rules");
    expect(r.flagged.length).toBeGreaterThan(0);
  });

  it("rejects obfuscated Arabic profanity with diacritics", () => {
    const r = runRules({ content: "كلام فارغ سـكــس بعده كلام" });
    expect(r.verdict).toBe("reject");
  });

  it("rejects elongated letter evasion", () => {
    const r = runRules({ content: "نص نظيف كسسس ثم ينتهي" });
    expect(r.verdict).toBe("reject");
  });

  it("rejects spaced-out evasion (spacing trick)", () => {
    const r = runRules({ content: "هنا ك س هنا" });
    expect(r.verdict).toBe("reject");
  });

  it("rejects zero-width character evasion", () => {
    const r = runRules({ content: "قبل ك\u200Bس بعد" });
    expect(r.verdict).toBe("reject");
  });

  it("catches alef-variant evasion (flagged, not silently missed)", () => {
    const r = runRules({ content: "أريد أن أقتلهم جميعاً" });
    expect(r.verdict).toBe("needs_human_review");
    expect(r.flagged.length).toBeGreaterThan(0);
  });

  it("routes direct violence wording to a human, not an auto-reject", () => {
    // Literature-safe design: a novel or a history book may legitimately
    // contain "أقتل". The rule layer flags it; a human decides.
    const r = runRules({ title: "خطاب", content: "أريد أن أقتلهم" });
    expect(r.verdict).toBe("needs_human_review");
    expect(r.categories).toContain("incitement");
  });

  it("rejects sectarian hate speech outright", () => {
    const r = runRules({ content: "هم الرافضة ولا نريد رؤيتهم" });
    expect(r.verdict).toBe("reject");
    expect(r.categories).toContain("incitement");
  });

  it("rejects English hard terms", () => {
    const r = runRules({ language: "en", content: "you should kill yourself right now" });
    expect(r.verdict).toBe("reject");
  });

  it("rejects explicit content in the title", () => {
    const r = runRules({ title: "قصة سكس" });
    expect(r.verdict).toBe("reject");
  });

  it("rejects a slur in the pen name", () => {
    const r = runRules({ penName: "خنزير المدينة" });
    expect(r.verdict).toBe("reject");
  });
});

describe("rule layer — soft / borderline → human review", () => {
  it("sends violent-history wording to human review, not auto-reject", () => {
    const r = runRules({ content: "في المذبحة التي وقعت عام ١٩٢٠ مات الآلاف من المدنيين" });
    expect(r.verdict).toBe("needs_human_review");
  });

  it("sends mature literary wording to human review", () => {
    const r = runRules({ content: "وصف الشهوة في الرواية كان جريئاً لكنه ليس إباحياً" });
    expect(r.verdict).toBe("needs_human_review");
  });

  it("does not auto-reject a war-history essay", () => {
    const r = runRules({ content: "روى المؤرخ تفاصيل الحرب والدم الذي سُفح في تلك المعارك" });
    expect(r.verdict).toBe("needs_human_review");
  });
});

describe("rule layer — spam", () => {
  it("flags external links", () => {
    const r = runRules({ content: "اقرأ المزيد هنا https://example.com/spam" });
    expect(r.flagged.some((f) => f.reason.includes("link"))).toBe(true);
  });

  it("rejects clearly promotional spam", () => {
    const r = runRules({ content: "Buy now! click here for free money https://bit.ly/x" });
    expect(r.verdict).toBe("reject");
  });
});

describe("rule layer — clean content", () => {
  it("approves a clean Arabic passage", () => {
    const r = runRules({
      title: "أناشيد النهر",
      content: "كان النهر يجري ببطء بين الضفتين، والقصائد تُكتب في المساء.",
      penName: "كاتب النهرين",
    });
    expect(r.verdict).toBe("approve");
    expect(r.categories).toEqual(["none"]);
  });

  it("approves a clean English passage", () => {
    const r = runRules({ title: "River Songs", content: "The river ran slow between two banks." });
    expect(r.verdict).toBe("approve");
  });
});
