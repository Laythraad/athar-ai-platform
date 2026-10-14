/* Server-only helpers for reading text out of uploaded PDF files.
 *
 * Why: a published work can be a PDF instead of inline text. The moderation
 * pipeline is text-based, so we extract the PDF's text and feed it through the
 * SAME rules + AI pipeline. A scanned/image PDF yields no text — that case must
 * never be auto-approved, so callers treat an empty result as "human review".

   Never imported from a "use client" file. */

import type { SupabaseClient } from "@supabase/supabase-js";

/** Hard cap so one enormous PDF can't blow up the AI prompt. */
const MAX_MODERATION_CHARS = 40_000;
/** pdf-parse appends "-- 1 of 2 --" page markers; strip them. */
const PAGE_MARKER = /\s*--\s*\d+\s+of\s+\d+\s*--/g;

export function cleanExtractedText(raw: string): string {
  return raw
    .replace(PAGE_MARKER, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/* ── Arabic reading-order repair ───────────────────────────────────────────
   pdfjs returns Arabic glyphs in *visual* order as presentation forms
   (e.g. "ﺮﻬﻨﻟا ﻰﻠﻋ ﺮﺠﻓ" instead of "فجر على النهر"). NFKC maps the
   presentation forms back to base letters; then each Arabic line is
   reversed back into logical order, with digit/Latin runs and sentence
   punctuation repaired. Pure function — unit-tested. */

const ARABIC_CHAR = /[؀-ۿݐ-ݿࢠ-ࣿ]/;
const ARABIC_LETTER = /[ء-يٮ-ۓپچژکگېڤڭڵھە]/;
const COMBINING_MARK = /[ً-ٰٟۖ-ۭ]/;
const DIGIT_RUN = /[0-9٠-۹]+(?:[.,:/-][0-9٠-۹]+)*/g;
const LATIN_RUN = /[A-Za-z]+(?:'[A-Za-z]+)*/g;
const SENTENCE_PUNCT = /[.,،؟!;:»"')\]]/;

/** Combining marks end up before their base letter after reversal. */
function fixCombiningMarks(s: string): string {
  let out = s;
  for (let pass = 0; pass < 6; pass++) {
    let changed = false;
    const chars = [...out];
    for (let i = 0; i < chars.length - 1; i++) {
      if (
        COMBINING_MARK.test(chars[i]) &&
        ARABIC_LETTER.test(chars[i + 1]) &&
        !COMBINING_MARK.test(chars[i + 1])
      ) {
        [chars[i], chars[i + 1]] = [chars[i + 1], chars[i]];
        changed = true;
      }
    }
    if (!changed) break;
    out = chars.join("");
  }
  return out;
}

/** Sentence punctuation must sit at a word boundary, never inside a word. */
function repairPunctuation(s: string): string {
  const chars = [...s];
  for (let pass = 0; pass < 8; pass++) {
    let changed = false;
    for (let i = 0; i < chars.length; i++) {
      if (!SENTENCE_PUNCT.test(chars[i])) continue;
      const prev = chars[i - 1];
      const next = chars[i + 1];
      // glued inside a word → move right, past the following letters
      if (prev && ARABIC_LETTER.test(prev) && next && ARABIC_LETTER.test(next)) {
        const punct = chars[i];
        let j = i + 1;
        while (j < chars.length && (ARABIC_LETTER.test(chars[j]) || COMBINING_MARK.test(chars[j])))
          j++;
        chars.splice(i, 1);
        chars.splice(j - 1, 0, punct);
        changed = true;
        break;
      }
      // stranded after a space → belongs to the end of the previous word
      if (prev === " " && next && ARABIC_LETTER.test(next)) {
        const punct = chars[i];
        let k = i - 2;
        while (k >= 0 && (ARABIC_LETTER.test(chars[k]) || COMBINING_MARK.test(chars[k]))) k--;
        chars.splice(i, 1);
        chars.splice(k + 1, 0, punct);
        changed = true;
        break;
      }
    }
    if (!changed) break;
  }
  return chars.join("");
}

/** Digits and Latin words stay LTR even inside Arabic text. */
function restoreLtrRuns(line: string): string {
  return line
    .replace(DIGIT_RUN, (m) => [...m].reverse().join(""))
    .replace(LATIN_RUN, (m) => [...m].reverse().join(""));
}

/** One extracted line, visual order → logical reading order. */
export function arabicLineToLogical(line: string): string {
  if (!ARABIC_CHAR.test(line)) return line;
  const normalized = line.normalize("NFKC");
  const reversed = [...normalized].reverse().join("");
  return fixCombiningMarks(repairPunctuation(restoreLtrRuns(reversed)));
}

/** Whole extracted text: repair every Arabic line; leave others untouched. */
export function restoreArabicReadingOrder(text: string): string {
  if (!ARABIC_CHAR.test(text)) return text;
  return text
    .split("\n")
    .map(arabicLineToLogical)
    .join("\n");
}

/** Extract text from an in-memory PDF. Returns "" on any failure (fail-closed). */
export async function extractPdfText(
  data: ArrayBuffer | Uint8Array,
): Promise<string> {
  try {
    const { PDFParse } = await import("pdf-parse");
    const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
    const parser = new PDFParse({ data: bytes });
    const res = await parser.getText();
    await parser.destroy?.();
    const text = restoreArabicReadingOrder(cleanExtractedText(res?.text ?? ""));
    return text.slice(0, MAX_MODERATION_CHARS);
  } catch {
    return "";
  }
}

/** Download a stored PDF from the private `work-files` bucket and read its text.
    Returns "" if the object is missing or unreadable — callers must treat that
    as "needs a human", never as "clean". */
export async function extractPdfTextFromStorage(
  admin: SupabaseClient,
  storagePath: string,
): Promise<string> {
  try {
    const { data, error } = await admin.storage
      .from("work-files")
      .download(storagePath);
    if (error || !data) return "";
    const buf = await data.arrayBuffer();
    return await extractPdfText(buf);
  } catch {
    return "";
  }
}
