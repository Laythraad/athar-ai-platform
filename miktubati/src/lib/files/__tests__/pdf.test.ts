import { describe, expect, it } from "vitest";
import {
  arabicLineToLogical,
  cleanExtractedText,
  restoreArabicReadingOrder,
} from "../pdf";

describe("arabicLineToLogical", () => {
  it("reverses a pure-Arabic visual line into logical order", () => {
    expect(arabicLineToLogical("ﺮﻬﻨﻟا ﻰﻠﻋ ﺮﺠﻓ")).toBe("فجر على النهر");
  });

  it("moves sentence-final period to the end of the word", () => {
    const out = arabicLineToLogical("ب.ﺎﺘﻛ ﻞﺜﻣ");
    expect(out).toContain("كتاب");
    expect(out.endsWith(".")).toBe(true);
  });

  it("keeps latin-only lines untouched", () => {
    expect(arabicLineToLogical("Hello, world!")).toBe("Hello, world!");
  });

  it("keeps digit runs readable after reversal", () => {
    const raw = ".ﻢﻛ 3.5 ﺔﻓﺎﺴمل، واﺔﻘﻴﻗد 150 رة أورﻮﻗز";
    const out = arabicLineToLogical(raw);
    expect(out).toContain("150");
    expect(out).toContain("3.5");
    expect(out).toContain("دقيقة");
    expect(out).toContain("مسافة");
  });
});

describe("restoreArabicReadingOrder", () => {
  it("repairs every arabic line of an extracted page", () => {
    const raw = "ﺮﻬﻨﻟا ﻰﻠﻋ ﺮﺠﻓ\nEnglish line\n"; // visual title + latin line
    const out = restoreArabicReadingOrder(raw);
    expect(out.split("\n")[0]).toBe("فجر على النهر");
    expect(out).toContain("English line");
  });

  it("leaves non-arabic text alone", () => {
    expect(restoreArabicReadingOrder("plain english\n123")).toBe(
      "plain english\n123",
    );
  });
});

describe("cleanExtractedText", () => {
  it("strips pdf-parse page markers", () => {
    expect(cleanExtractedText("hello\n-- 1 of 2 --\nworld")).toBe(
      "hello\nworld",
    );
  });
});
