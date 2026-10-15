import { describe, it, expect } from "vitest";
import { libKindFor, hasPdfMagic, cleanExtractedText, extFor, LIB_MAX_BYTES } from "../library";

describe("libKindFor", () => {
  it("maps allowed MIME types", () => {
    expect(libKindFor("application/pdf")).toBe("pdf");
    expect(libKindFor("text/plain")).toBe("text");
    expect(libKindFor("text/markdown")).toBe("text");
    expect(libKindFor("image/png")).toBe("image");
    expect(libKindFor("image/jpeg")).toBe("image");
    expect(libKindFor("image/webp")).toBe("image");
  });

  it("is case-insensitive and rejects unknown types", () => {
    expect(libKindFor("APPLICATION/PDF")).toBe("pdf");
    expect(libKindFor("text/html")).toBeNull();
    expect(libKindFor("application/x-msdownload")).toBeNull();
    expect(libKindFor("")).toBeNull();
  });
});

describe("hasPdfMagic", () => {
  it("accepts real PDF bytes", () => {
    expect(hasPdfMagic(new TextEncoder().encode("%PDF-1.7\n"))).toBe(true);
  });
  it("rejects fakes", () => {
    expect(hasPdfMagic(new TextEncoder().encode("<html>"))).toBe(false);
    expect(hasPdfMagic(new Uint8Array([0x25, 0x50]))).toBe(false);
    expect(hasPdfMagic(new Uint8Array())).toBe(false);
  });
});

describe("cleanExtractedText", () => {
  it("strips pdf-parse page markers and collapses blank lines", () => {
    const raw = "Hello\n\n\nworld -- 1 of 3 --\nend -- 2 of 3 --";
    expect(cleanExtractedText(raw)).toBe("Hello\n\nworld\nend");
  });
  it("trims whitespace", () => {
    expect(cleanExtractedText("  hi  ")).toBe("hi");
  });
});

describe("extFor + caps", () => {
  it("maps MIME to extension", () => {
    expect(extFor("application/pdf")).toBe("pdf");
    expect(extFor("image/jpeg")).toBe("jpg");
    expect(extFor("text/markdown")).toBe("md");
    expect(extFor("text/plain")).toBe("txt");
  });
  it("25 MB cap is enforced as a constant", () => {
    expect(LIB_MAX_BYTES).toBe(25 * 1024 * 1024);
  });
});
