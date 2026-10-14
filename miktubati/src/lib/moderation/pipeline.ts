/* Moderation pipeline — submission → checks → decision.
   Fail-closed by design: if anything downstream breaks, the content stays
   pending_review and a human sees it. It is NEVER auto-published on error.

   Order:
     1. rule layer  (deterministic, unit-tested)
        → reject on hard terms (slurs / explicit / incitement / sectarian hate)
        → needs_human_review on soft terms (mature literary themes)
     2. AI layer    (Gemini, server-side)
        → strict JSON verdict
     3. combine
        rules reject  → reject (reasons from both layers are kept)
        else AI verdict
        AI error      → needs_human_review  (fail-closed)   */

import { runRules } from "./rules";
import { callGemini } from "./gemini";
import type { ModerationInput, ModerationResult, Verdict } from "./types";

export interface PipelineOptions {
  /** Injected for tests; defaults to the real Gemini caller. */
  ai?: (input: ModerationInput) => Promise<{
    verdict: Verdict;
    categories: ModerationResult["categories"];
    reasons: string[];
    flagged: ModerationResult["flagged"];
    confidence: ModerationResult["confidence"];
  }>;
  /** Skip the AI layer entirely (used by the rule-only unit tests). */
  skipAi?: boolean;
}

/** Higher severity wins between two verdicts. */
function worst(a: Verdict, b: Verdict): Verdict {
  const rank: Record<Verdict, number> = { approve: 0, needs_human_review: 1, reject: 2 };
  return rank[a] >= rank[b] ? a : b;
}

export async function moderate(
  input: ModerationInput,
  opts: PipelineOptions = {},
): Promise<ModerationResult> {
  const rules = runRules({
    title: input.title,
    description: input.description,
    content: input.content,
    penName: input.penName,
    bio: input.bio,
  });

  // 1. Hard rule-layer rejection wins outright.
  if (rules.verdict === "reject") {
    return {
      verdict: "reject",
      categories: rules.categories,
      reasons: rules.reasons,
      flagged: rules.flagged,
      confidence: rules.confidence,
      source: "rules",
    };
  }

  // 2. Soft rule hits already mean "a human should look" — we still ask the AI
  //    so the moderator sees its reasoning, but the floor is human review.
  const floorIsHuman = rules.verdict === "needs_human_review";

  if (opts.skipAi) {
    return {
      verdict: floorIsHuman ? "needs_human_review" : "approve",
      categories: rules.categories,
      reasons: rules.reasons,
      flagged: rules.flagged,
      confidence: rules.confidence,
      source: "rules",
    };
  }

  const aiFn = opts.ai ?? ((i: ModerationInput) => callGemini(i));

  let ai;
  try {
    ai = await aiFn(input);
  } catch (e) {
    // FAIL-CLOSED: AI unavailable / not configured / bad response.
    const key =
      typeof e === "object" && e !== null && "key" in e
        ? String((e as { key: unknown }).key)
        : "ai_unavailable";
    return {
      verdict: "needs_human_review",
      categories: rules.categories.length ? rules.categories : ["none"],
      reasons: [
        ...rules.reasons,
        "The automated check could not complete, so a human must review this submission.",
      ],
      flagged: rules.flagged,
      confidence: "low",
      source: "system",
      errorKey: key,
    };
  }

  const verdict = floorIsHuman ? worst("needs_human_review", ai.verdict) : ai.verdict;

  return {
    verdict,
    categories: Array.from(new Set([...rules.categories, ...ai.categories])),
    reasons: Array.from(new Set([...rules.reasons, ...ai.reasons])),
    flagged: [...rules.flagged, ...ai.flagged].slice(0, 40),
    confidence: ai.confidence,
    source: "ai",
  };
}

/** Override a verdict to "needs human review" — used when an uploaded file has
    no machine-readable text, so the AI never gets to approve content it could
    not actually read. A hard `reject` is always kept. */
export function forceHumanReview(r: ModerationResult): ModerationResult {
  if (r.verdict === "reject") return r;
  return {
    ...r,
    verdict: "needs_human_review",
    source: "system",
    confidence: "low",
    reasons: [
      ...r.reasons,
      "The uploaded file has no extractable text (scanned or image-only PDF), so a human must review it.",
    ],
  };
}

/** Map a pipeline verdict onto a work status string used in the DB. */
export function verdictToStatus(verdict: Verdict): "published" | "pending_review" | "rejected" {
  if (verdict === "approve") return "published";
  if (verdict === "reject") return "rejected";
  return "pending_review";
}
