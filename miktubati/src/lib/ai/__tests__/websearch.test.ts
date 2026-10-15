import { describe, it, expect } from "vitest";
import { needsWeb, classifyKind } from "../websearch";

describe("needsWeb classifier", () => {
  it("flags freshness words in Arabic", () => {
    expect(needsWeb("ما الفعاليات هذا الأسبوع في بغداد؟")).toBe(true);
    expect(needsWeb("أخبار المتحف العراقي اليوم")).toBe(true);
    expect(needsWeb("الطقس في البصرة")).toBe(true);
  });

  it("flags freshness words in English", () => {
    expect(needsWeb("events this weekend in Erbil")).toBe(true);
    expect(needsWeb("latest news about the Iraq Museum")).toBe(true);
    expect(needsWeb("weather forecast for Karbala tomorrow")).toBe(true);
  });

  it("flags explicit search/source requests", () => {
    expect(needsWeb("ابحث عن مصدر يؤكد هذه المعلومة")).toBe(true);
    expect(needsWeb("search for open access books about Mesopotamia")).toBe(true);
  });

  it("does not flag stable cultural questions", () => {
    expect(needsWeb("من بنى المدرّج في أور؟")).toBe(false);
    expect(needsWeb("tell me about the Ishtar Gate")).toBe(false);
    expect(needsWeb("ما معنى المصطلح الأثري «نيجيريتي»؟")).toBe(false);
  });

  it("handles empty input", () => {
    expect(needsWeb("")).toBe(false);
    expect(needsWeb("   ")).toBe(false);
  });
});

describe("classifyKind", () => {
  it("detects weather / news / travel / historical", () => {
    expect(classifyKind("الطقس في أربيل")).toBe("weather");
    expect(classifyKind("latest news on Babylon restoration")).toBe("news");
    expect(classifyKind("cheap hotels near Karbala")).toBe("travel");
    expect(classifyKind("history of the Abbasid era")).toBe("historical");
    expect(classifyKind("what is a ziggurat")).toBe("general");
  });
});
