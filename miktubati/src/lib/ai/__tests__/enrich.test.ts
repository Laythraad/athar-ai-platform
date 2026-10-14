import { describe, expect, it } from "vitest";
import { mergeTags } from "../enrich";
import { targetFor } from "../translate";

describe("mergeTags", () => {
  it("merges author + ai tags in order", () => {
    expect(mergeTags(["شعر"], ["حرب", "مديح"])).toEqual(["شعر", "حرب", "مديح"]);
  });

  it("de-duplicates case-insensitively", () => {
    expect(mergeTags(["نهر"], ["نهر", "ماء"])).toEqual(["نهر", "ماء"]);
  });

  it("drops empty and whitespace-only tags", () => {
    expect(mergeTags(["", "  ", "نهر"], ["  "])).toEqual(["نهر"]);
  });

  it("caps at 10", () => {
    const many = Array.from({ length: 15 }, (_, i) => `t${i}`);
    expect(mergeTags(many, []).length).toBe(10);
  });
});

describe("targetFor", () => {
  it("translates Arabic works to English", () => {
    expect(targetFor("ar")).toBe("en");
  });
  it("translates English works to Arabic", () => {
    expect(targetFor("en")).toBe("ar");
    expect(targetFor("fr")).toBe("ar");
  });
});
