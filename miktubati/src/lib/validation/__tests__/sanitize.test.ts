import { describe, it, expect } from "vitest";
import {
  escapeHtml, stripTags, removeDangerousBlocks, sanitizeText,
  sanitizeContent, sanitizeTags, sanitizePenName,
} from "../../validation/sanitize";

describe("sanitize — XSS", () => {
  it("escapes HTML special characters", () => {
    expect(escapeHtml('<img src=x onerror=alert(1)>')).toBe(
      "&lt;img src=x onerror=alert(1)&gt;",
    );
  });

  it("strips tags", () => {
    expect(stripTags("hello <b>world</b>")).toBe("hello world");
  });

  it("removes script blocks including content", () => {
    expect(removeDangerousBlocks('safe<script>alert("x")</script>after')).toBe("safeafter");
  });

  it("removes style/iframe/svg blocks", () => {
    expect(removeDangerousBlocks("a<style>body{}</style>b")).toBe("ab");
    expect(removeDangerousBlocks("a<iframe src=x></iframe>b")).toBe("ab");
    expect(removeDangerousBlocks("a<svg onload=alert(1)></svg>b")).toBe("ab");
  });

  it("sanitizeText neutralises a full XSS payload in a bio", () => {
    const payload = `<script>fetch('/steal?c='+document.cookie)</script><img src=x onerror="alert('xss')">Nice bio`;
    const clean = sanitizeText(payload);
    expect(clean).not.toContain("<script");
    expect(clean).not.toContain("onerror");
    expect(clean).toContain("Nice bio");
  });

  it("sanitizeText kills event handlers even without tags", () => {
    const clean = sanitizeText('<img src=x onerror=alert(1)>Bio here');
    expect(clean).not.toContain("onerror");
  });

  it("removes null bytes", () => {
    expect(sanitizeText("ab\u0000cd")).toBe("abcd");
  });

  it("sanitizeContent preserves newlines but strips HTML", () => {
    const out = sanitizeContent("السطر الأول\n\nالسطر الثاني\n<b>غامق</b>");
    expect(out).toContain("السطر الأول");
    expect(out).not.toContain("<b>");
    expect(out).toContain("غامق");
  });

  it("sanitizeContent collapses excessive blank lines", () => {
    expect(sanitizeContent("a\n\n\n\n\n\nb")).toBe("a\n\nb");
  });
});

describe("sanitize — tags, pen name", () => {
  it("cleans and dedupes tags", () => {
    expect(sanitizeTags(["شعر", "Poetry", "شعر", "  نثر  "])).toEqual(["شعر", "poetry", "نثر"]);
  });

  it("caps tag count at 12", () => {
    const many = Array.from({ length: 20 }, (_, i) => `tag${i}`);
    expect(sanitizeTags(many).length).toBe(12);
  });

  it("strips links and @ from pen names", () => {
    expect(sanitizePenName("https://evil.com @handle كاتب")).toBe("evil.com handle كاتب");
  });

  it("caps pen name at 30 chars", () => {
    expect(sanitizePenName("a".repeat(60)).length).toBe(30);
  });
});
