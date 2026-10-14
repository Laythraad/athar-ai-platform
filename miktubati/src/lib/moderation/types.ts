/* Shared moderation types. */

export type Verdict = "approve" | "reject" | "needs_human_review";

export type ModerationCategory =
  | "obscene"
  | "insults_or_hate"
  | "incitement"
  | "harassment_or_doxxing"
  | "defamation"
  | "spam"
  | "plagiarism_suspected"
  | "none";

export interface FlaggedExcerpt {
  excerpt: string;
  reason: string;
  offset?: number;
}

export interface ModerationResult {
  verdict: Verdict;
  categories: ModerationCategory[];
  reasons: string[];
  flagged: FlaggedExcerpt[];
  confidence: "high" | "medium" | "low" | "none";
  source: "rules" | "ai" | "system";
  /** Populated when the AI layer could not run (fail-closed path). */
  errorKey?: string;
}

export interface ModerationInput {
  /** Optional: content-only moderation (e.g. a review) is valid. */
  title?: string;
  description?: string;
  content?: string;
  penName?: string;
  /** Real 3-part name — moderated like every other identity field. */
  fullName?: string;
  bio?: string;
  language?: string;
}

export const EMPTY_RESULT: ModerationResult = {
  verdict: "approve",
  categories: ["none"],
  reasons: [],
  flagged: [],
  confidence: "none",
  source: "system",
};
