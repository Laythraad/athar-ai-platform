/* Rule-based moderation layer (layer 1 of the pipeline).
   Runs BEFORE the AI layer and is fully deterministic + unit-tested.

   Design decisions (see README):
   • Hard terms (slurs, explicit sexual terms, direct incitement) → reject.
   • Soft terms (violence / sexual words that legitimately appear in literature,
     history and heritage writing) → needs_human_review, never auto-reject.
     We do not censor real literature.
   • Sectarian / ethnic hate terms → reject.
   • Spam heuristics → needs_human_review; clearly promotional spam → reject.
   • The rule layer NEVER auto-approves over the AI layer; it only raises the
     floor. The pipeline decides the final verdict. */

import { normalizeForMatch, despace, normalizeArabic } from "./normalize";
import {
  HARD_TERMS_AR,
  HARD_TERMS_EN,
  SOFT_TERMS_AR,
  SOFT_TERMS_EN,
  SECTARIAN_TERMS_AR,
  SPAM_PATTERNS,
} from "./profanity";
import type { FlaggedExcerpt, ModerationCategory, ModerationInput, ModerationResult, Verdict } from "./types";

/** Categories that must never be auto-approved by the rule layer. */
const REJECT_CATEGORIES: ModerationCategory[] = ["obscene", "incitement"];

/** Soft terms whose category depends on which list they came from. */
const VIOLENCE_SOFT = new Set(["قتل", "اقتل", "أقتل", "تفجير", "اغتصاب", "انتحر", "ساحقكم", "حرقهم", "تعذيب",
  "kill them", "i will kill", "war crime", "massacre"]);

function excerptAround(text: string, index: number, len: number, radius = 40): string {
  const start = Math.max(0, index - radius);
  const end = Math.min(text.length, index + len + radius);
  return text.slice(start, end).trim();
}

interface Match {
  term: string;
  index: number;
  category: ModerationCategory;
  severity: "hard" | "soft";
  reason: string;
  /** The ORIGINAL text this hit was found in (before normalisation) — the
      flagged excerpt must be sliced from this, not from an unrelated field. */
  fieldText: string;
}

/** Find every term hit in a single text blob. */
function findMatches(label: string, text: string): Match[] {
  const out: Match[] = [];
  if (!text) return out;

  const normalized = normalizeForMatch(text);
  // Despacing defeats "ا ل ك س" style evasion. Always computed, always checked,
  // regardless of whether the TERM itself contains a space.
  const despaced = despace(text);

  const hardAr = HARD_TERMS_AR.map((t) => normalizeForMatch(t));
  const hardEn = HARD_TERMS_EN.map((t) => t.toLowerCase());
  const softAr = SOFT_TERMS_AR.map((t) => normalizeForMatch(t));
  const softEn = SOFT_TERMS_EN.map((t) => t.toLowerCase());
  const sectAr = SECTARIAN_TERMS_AR.map((t) => normalizeForMatch(t));

  function scan(
    list: string[],
    severity: "hard" | "soft",
    category: ModerationCategory,
    reason: string,
  ) {
    for (const termRaw of list) {
      if (!termRaw) continue;
      const term = termRaw;
      const termDespaced = term.replace(/\s+/g, "");

      // (a) match against the normalised text
      let idx = normalized.indexOf(term);
      while (idx !== -1) {
        out.push({ term, index: idx, category, severity, reason: `${label}: ${reason}`, fieldText: text });
        idx = normalized.indexOf(term, idx + term.length);
      }

      // (b) match against the DESPACED text — catches spacing evasion.
      //     Skip if we already matched (a) at the same normalised term with no
      //     spaces in it, because the despaced scan would be a duplicate hit
      //     for the same word; only run it when it can add something new.
      if (termDespaced) {
        let j = despaced.indexOf(termDespaced);
        while (j !== -1) {
          out.push({
            term,
            index: j,
            category,
            severity,
            reason: `${label}: ${reason} (obfuscated)`,
            fieldText: text,
          });
          j = despaced.indexOf(termDespaced, j + termDespaced.length);
        }
      }
    }
  }

  scan(hardAr, "hard", "obscene", "explicit or abusive term");
  scan(hardEn, "hard", "obscene", "explicit or abusive term");
  scan(sectAr, "hard", "incitement", "sectarian or ethnic hate speech");

  for (const term of softAr) {
    const cat: ModerationCategory = VIOLENCE_SOFT.has(term) || VIOLENCE_SOFT.has(normalizeArabic(term))
      ? "incitement"
      : "obscene";
    scan([term], "soft", cat, "term that may be violent or sexual — needs a human");
  }
  for (const term of softEn) {
    const cat: ModerationCategory = VIOLENCE_SOFT.has(term) ? "incitement" : "obscene";
    scan([term], "soft", cat, "term that may be violent or sexual — needs a human");
  }

  return out;
}

function checkSpam(label: string, text: string): Match[] {
  const out: Match[] = [];
  if (!text) return out;
  for (const re of SPAM_PATTERNS) {
    const flags = re.flags.includes("g") ? re.flags : re.flags + "g";
    const rx = new RegExp(re.source, flags);
    let m: RegExpExecArray | null;
    while ((m = rx.exec(text)) !== null) {
      const matched = m[0];
      const clearlyPromo = /https?:\/\/|www\.|bit\.ly|t\.me|discord\.gg|buy now|click here|free money/i.test(matched);
      out.push({
        term: matched,
        index: m.index,
        category: "spam",
        severity: clearlyPromo ? "hard" : "soft",
        reason: `${label}: ${clearlyPromo ? "external link or promotion" : "possible spam pattern"}`,
        fieldText: text,
      });
      if (m.index === rx.lastIndex) rx.lastIndex++;
    }
  }
  return out;
}

/** Run the rule layer over a whole submission.
 *  `language` is accepted for interface parity with the AI layer but ignored —
 *  the rule layer always scans the Arabic AND English lists together, so an
 *  English slur inside an Arabic work is still caught. */
export function runRules(input: ModerationInput): ModerationResult {
  const matches: Match[] = [
    ...findMatches("title", input.title ?? ""),
    ...findMatches("description", input.description ?? ""),
    ...findMatches("content", input.content ?? ""),
    ...findMatches("pen name", input.penName ?? ""),
    ...findMatches("full name", input.fullName ?? ""),
    ...findMatches("bio", input.bio ?? ""),
    ...checkSpam("title", input.title ?? ""),
    ...checkSpam("description", input.description ?? ""),
    ...checkSpam("content", input.content ?? ""),
    ...checkSpam("bio", input.bio ?? ""),
  ];

  if (matches.length === 0) {
    return {
      verdict: "approve",
      categories: ["none"],
      reasons: [],
      flagged: [],
      confidence: "high",
      source: "rules",
    };
  }

  // Slice each excerpt from the field it was actually found in (a title hit
  // no longer shows a snippet of the content, and a bio hit of the title).
  const flagged: FlaggedExcerpt[] = matches.map((m) => ({
    excerpt: excerptAround(normalizeArabic(m.fieldText), m.index, m.term.length),
    reason: m.reason,
    offset: m.index,
  }));

  const categories = Array.from(new Set(matches.map((m) => m.category)));
  const reasons = Array.from(new Set(matches.map((m) => m.reason)));

  let verdict: Verdict;
  let confidence: ModerationResult["confidence"];

  const hasHardReject = matches.some(
    (m) => m.severity === "hard" && (REJECT_CATEGORIES.includes(m.category) || m.category === "spam"),
  );
  const hasOnlySoft = !hasHardReject && matches.some((m) => m.severity === "soft");

  if (hasHardReject) {
    verdict = "reject";
    confidence = "high";
  } else if (hasOnlySoft) {
    // mature / dark themes and borderline wording → a human decides
    verdict = "needs_human_review";
    confidence = "medium";
  } else {
    verdict = "needs_human_review";
    confidence = "low";
  }

  return { verdict, categories, reasons, flagged, confidence, source: "rules" };
}
