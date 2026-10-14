/* Text normalisation used by the rule-based moderation layer.
   Arabic is routinely obfuscated to slip past filters, so we undo the common
   tricks before matching: diacritics, elongation, character substitution,
   invisible characters, and spacing tricks. */

/** Remove Arabic diacritics (tashkeel) and tatweel (kashida). */
export function stripDiacritics(input: string): string {
  return input
    // Arabic diacritics + superscript alef + superscript Quranic marks
    .replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u08D3-\u08E1\u08E3-\u08FF]/g, "")
    // tatweel / kashida
    .replace(/\u0640/g, "");
}

/** Collapse letter elongation ("خخخخـي" → "خي"). */
export function collapseElongation(input: string): string {
  return input.replace(/([\u0621-\u064A])\1{1,}/g, "$1");
}

/** Remove zero-width and invisible characters used to break up words. */
export function stripInvisible(input: string): string {
  return input.replace(
    /[\u200B-\u200F\u202A-\u202E\u2060-\u2064\uFEFF\u00AD\u180E]/g,
    "",
  );
}

/** Normalise alef variants to bare alef; remove taa marbuta ambiguity softly. */
export function normalizeAlef(input: string): string {
  return input
    .replace(/[\u0622\u0623\u0625\u0671]/g, "\u0627")
    .replace(/\u0649/g, "\u064A"); // alef maqsura → yaa
}

/** Common Arabic letter look-alikes typed on a Latin keyboard. */
const SUBSTITUTIONS: Record<string, string> = {
  a: "ا", b: "ب", t: "ت", th: "ث", j: "ج", h: "ح", kh: "خ", d: "د",
  dh: "ذ", r: "ر", z: "ز", s: "س", sh: "ش", s2: "ص", d2: "ض", t2: "ط",
  z2: "ظ", e: "ع", g: "غ", f: "ف", q: "ق", k: "ك", l: "ل", m: "م",
  n: "ن", h2: "ه", w: "و", y: "ي", p: "ب", v: "ف", c: "ك", x: "خ",
  u: "و", i: "ي", o: "ي",
};

/** Best-effort: if a token is mostly Latin letters but looks like transliterated
    Arabic abuse, map it back to an Arabic form for matching. */
export function translitToArabic(token: string): string {
  let out = "";
  let i = 0;
  const lower = token.toLowerCase();
  while (i < lower.length) {
    const two = lower.slice(i, i + 2);
    if (SUBSTITUTIONS[two]) { out += SUBSTITUTIONS[two]; i += 2; continue; }
    const one = lower[i];
    if (SUBSTITUTIONS[one]) { out += SUBSTITUTIONS[one]; i += 1; continue; }
    out += one; i += 1;
  }
  return out;
}

/** Full normalisation pipeline for a matched string. */
export function normalizeArabic(input: string): string {
  let s = stripInvisible(input);
  s = stripDiacritics(s);
  s = collapseElongation(s);
  s = normalizeAlef(s);
  s = s.replace(/\s+/g, " ").trim();
  return s;
}

/** Normalise a whole text but keep word boundaries for excerpt reporting. */
export function normalizeForMatch(input: string): string {
  return normalizeArabic(input.toLowerCase());
}

/** Remove spaces entirely — used to defeat "ا ل ك س" style spacing attacks. */
export function despace(input: string): string {
  return normalizeForMatch(input).replace(/\s+/g, "");
}
