import { describe, it, expect } from "vitest";
import { validatePublish, publishWorkSchema } from "../work";

const base = {
  title: "قصيدة النهر",
  category: "poetry",
  content: "كان النهر يجري ببطء.",
  ownsRights: true,
};

describe("validatePublish", () => {
  it("accepts a clean text work and sanitises it", () => {
    const r = validatePublish({ ...base, description: "وصف <b>جميل</b>", tags: ["شعر", "شعر"] });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.title).toBe("قصيدة النهر");
      expect(r.value.description).not.toContain("<b>");
      expect(r.value.tags).toEqual(["شعر"]);
    }
  });

  it("requires the ownership checkbox", () => {
    const r = validatePublish({ ...base, ownsRights: undefined });
    expect(r.ok).toBe(false);
  });

  it("requires text or a file", () => {
    const r = validatePublish({ ...base, content: "", filePath: undefined });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.content).toBeTruthy();
  });

  it("accepts a file-only submission", () => {
    const r = validatePublish({
      ...base, content: "", filePath: "u1/work.pdf",
      fileMime: "application/pdf", fileSize: 1024,
    });
    expect(r.ok).toBe(true);
  });

  it("rejects a disallowed file type", () => {
    const r = validatePublish({
      ...base, content: "", filePath: "u1/x.exe",
      fileMime: "application/x-msdownload", fileSize: 100,
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.fileMime).toBeTruthy();
  });

  it("rejects a file over 20 MB", () => {
    const r = validatePublish({
      ...base, content: "", filePath: "u1/big.pdf",
      fileMime: "application/pdf", fileSize: 25 * 1024 * 1024,
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.fileSize).toBeTruthy();
  });

  it("rejects an unknown category", () => {
    const r = validatePublish({ ...base, category: "not-a-category" });
    expect(r.ok).toBe(false);
  });

  it("rejects an empty title", () => {
    const r = validatePublish({ ...base, title: "   " });
    expect(r.ok).toBe(false);
  });

  it("rejects a title over 200 chars", () => {
    const r = validatePublish({ ...base, title: "x".repeat(201) });
    expect(r.ok).toBe(false);
  });

  it("rejects content over the size cap", () => {
    const r = validatePublish({ ...base, content: "x".repeat(200_001) });
    expect(r.ok).toBe(false);
  });

  it("strips an XSS payload out of the title", () => {
    const r = validatePublish({ ...base, title: "<script>alert(1)</script>عنوان" });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.title).not.toContain("<script");
  });

  it("schema shape is exported for reuse", () => {
    expect(publishWorkSchema).toBeTruthy();
  });
});
