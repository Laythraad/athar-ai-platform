import { describe, it, expect } from "vitest";
import { moderate, verdictToStatus } from "../pipeline";

const CLEAN = {
  title: "أناشيد النهر",
  content: "كان النهر يجري ببطء بين الضفتين.",
  language: "ar",
};

describe("pipeline — fail-closed behaviour", () => {
  it("AI not configured → needs_human_review, never publish", async () => {
    const r = await moderate(CLEAN, {
      ai: async () => { throw Object.assign(new Error("x"), { key: "ai_not_configured" }); },
    });
    expect(r.verdict).toBe("needs_human_review");
    expect(r.errorKey).toBe("ai_not_configured");
    expect(verdictToStatus(r.verdict)).toBe("pending_review");
  });

  it("AI network failure → needs_human_review", async () => {
    const r = await moderate(CLEAN, {
      ai: async () => { throw Object.assign(new Error("x"), { key: "ai_unavailable" }); },
    });
    expect(r.verdict).toBe("needs_human_review");
    expect(verdictToStatus(r.verdict)).toBe("pending_review");
  });

  it("AI returns unparseable → still fail-closed", async () => {
    const r = await moderate(CLEAN, {
      ai: async () => { throw Object.assign(new Error("x"), { key: "ai_bad_response" }); },
    });
    expect(r.verdict).toBe("needs_human_review");
  });

  it("AI unavailable + offensive content → still REJECTED by rules (rules win)", async () => {
    const r = await moderate({ content: "سكس" }, {
      ai: async () => { throw new Error("nope"); },
    });
    expect(r.verdict).toBe("reject");
    expect(r.source).toBe("rules");
  });
});

describe("pipeline — verdict combination", () => {
  it("AI approve + clean rules → approve", async () => {
    const r = await moderate(CLEAN, {
      ai: async () => ({
        verdict: "approve", categories: ["none"], reasons: [], flagged: [], confidence: "high",
      }),
    });
    expect(r.verdict).toBe("approve");
    expect(verdictToStatus(r.verdict)).toBe("published");
  });

  it("AI reject → reject with AI reasons", async () => {
    const r = await moderate(CLEAN, {
      ai: async () => ({
        verdict: "reject", categories: ["obscene"], reasons: ["explicit content"],
        flagged: [{ excerpt: "…", reason: "explicit" }], confidence: "high",
      }),
    });
    expect(r.verdict).toBe("reject");
    expect(r.reasons).toContain("explicit content");
  });

  it("borderline literary → AI says human review → stays pending", async () => {
    const r = await moderate(
      { title: "رواية الحرب", content: "روى الجرحى ما حدث في تلك الليلة." },
      {
        ai: async () => ({
          verdict: "needs_human_review", categories: ["incitement"],
          reasons: ["mature war themes"], flagged: [], confidence: "medium",
        }),
      },
    );
    expect(r.verdict).toBe("needs_human_review");
    expect(verdictToStatus(r.verdict)).toBe("pending_review");
  });

  it("soft rule hit floors the result at human review even if AI approves", async () => {
    const r = await moderate(
      { content: "في المذبحة مات الآلاف" },
      {
        ai: async () => ({
          verdict: "approve", categories: ["none"], reasons: [], flagged: [], confidence: "high",
        }),
      },
    );
    expect(r.verdict).toBe("needs_human_review");
  });
});

describe("pipeline — skipAi (rule-only)", () => {
  it("clean content with skipAi → approve", async () => {
    const r = await moderate(CLEAN, { skipAi: true });
    expect(r.verdict).toBe("approve");
    expect(r.source).toBe("rules");
  });
});

describe("verdictToStatus", () => {
  it("maps correctly", () => {
    expect(verdictToStatus("approve")).toBe("published");
    expect(verdictToStatus("reject")).toBe("rejected");
    expect(verdictToStatus("needs_human_review")).toBe("pending_review");
  });
});
