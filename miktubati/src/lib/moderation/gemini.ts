/* AI moderation layer (layer 2) — Google Gemini, server-side only.
   Never called from the browser; the key lives in the server environment.

   Fail-closed contract:
   • No key configured        → throw { key: "ai_not_configured" }
   • Network / API failure    → throw { key: "ai_unavailable" }
   • Unparseable response     → throw { key: "ai_bad_response" }
   The pipeline turns every one of these into needs_human_review so that a
   broken AI never auto-publishes content. */

import type { FlaggedExcerpt, ModerationCategory, ModerationInput, Verdict } from "./types";

const ENDPOINT = (model: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

export interface GeminiVerdict {
  verdict: Verdict;
  categories: ModerationCategory[];
  reasons: string[];
  flagged: FlaggedExcerpt[];
  confidence: "high" | "medium" | "low" | "none";
}

function systemInstruction(lang: string): string {
  return [
    "You are the content-moderation engine of MIKTUBATI, an Arabic cultural community library.",
    "You review user-submitted literary works for the community guidelines.",
    "Answer in JSON ONLY. No markdown, no prose.",
    "Output schema:",
    '{"verdict":"approve|reject|needs_human_review","categories":["obscene","insults_or_hate","incitement","harassment_or_doxxing","defamation","spam","plagiarism_suspected","none"],"reasons":["short reason"],"flagged":[{"excerpt":"offending text","reason":"why"}],"confidence":"high|medium|low|none"}',
    "Rules:",
    "- approve: content respects the guidelines.",
    "- reject: clear slurs, sexually explicit content, incitement to violence, hate toward a religion/sect/ethnicity, doxxing, or blatant spam.",
    "- needs_human_review: BORDERLINE cases, especially literary works with mature or dark themes (war, grief, trauma, intimacy) that are not gratuitous. Do NOT censor real literature.",
    "- Keep reasons short and specific. Quote the exact offending excerpt.",
    "- The user's language is " + lang + ".",
  ].join("\n");
}

function parseJsonLoose(raw: string): unknown {
  const s = String(raw || "").trim()
    .replace(/^```json\s*/i, "").replace(/^```\s*/, "").replace(/\s*```$/, "");
  const start = s.indexOf("{");
  const end = s.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("ai_bad_response");
  return JSON.parse(s.slice(start, end + 1));
}

function normaliseVerdict(v: unknown): Verdict {
  const s = String(v || "").toLowerCase();
  if (s === "approve" || s === "reject" || s === "needs_human_review") return s;
  return "needs_human_review";
}

function normaliseCategories(c: unknown): ModerationCategory[] {
  if (!Array.isArray(c)) return ["none"];
  const allowed: ModerationCategory[] = [
    "obscene", "insults_or_hate", "incitement", "harassment_or_doxxing",
    "defamation", "spam", "plagiarism_suspected", "none",
  ];
  const out = c.map((x) => String(x)).filter((x): x is ModerationCategory =>
    (allowed as string[]).includes(x));
  return out.length ? out : ["none"];
}

export async function callGemini(
  input: ModerationInput,
  opts?: { apiKey?: string; model?: string; fetchImpl?: typeof fetch },
): Promise<GeminiVerdict> {
  const apiKey = opts?.apiKey ?? process.env.GEMINI_API_KEY ?? "";
  const model = opts?.model ?? process.env.GEMINI_MODEL ?? "gemini-flash-lite-latest";
  const fetchImpl = opts?.fetchImpl ?? fetch;
  const lang = input.language ?? "ar";

  if (!apiKey) {
    throw Object.assign(new Error("ai_not_configured"), { key: "ai_not_configured" });
  }

  const payloadText = [
    `TITLE: ${input.title ?? ""}`,
    `DESCRIPTION: ${input.description ?? ""}`,
    `PEN NAME: ${input.penName ?? ""}`,
    `BIO: ${input.bio ?? ""}`,
    `CONTENT:\n${(input.content ?? "").slice(0, 12000)}`,
  ].join("\n\n");

  const body = {
    systemInstruction: { parts: [{ text: systemInstruction(lang) }] },
    contents: [{ role: "user", parts: [{ text: payloadText }] }],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 900,
      responseMimeType: "application/json",
    },
  };

  let res: Response;
  try {
    res = await fetchImpl(`${ENDPOINT(model)}?key=${encodeURIComponent(apiKey)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw Object.assign(new Error("ai_unavailable"), { key: "ai_unavailable" });
  }

  if (!res.ok) {
    // 4xx/5xx → never auto-approve; the pipeline routes to human review.
    throw Object.assign(new Error("ai_unavailable"), { key: "ai_unavailable" });
  }

  interface GeminiApiResponse {
    candidates?: {
      content?: {
        parts?: { text?: string }[];
      };
    }[];
  }

  interface GeminiVerdictJson {
    verdict?: unknown;
    categories?: unknown;
    reasons?: unknown;
    flagged?: { excerpt?: unknown; reason?: unknown }[];
    confidence?: unknown;
  }

  let data: GeminiApiResponse;
  try {
    data = (await res.json()) as GeminiApiResponse;
  } catch {
    throw Object.assign(new Error("ai_bad_response"), { key: "ai_bad_response" });
  }

  const text: string =
    data?.candidates?.[0]?.content?.parts?.map((p) => p?.text ?? "").join("") ?? "";

  let parsed: GeminiVerdictJson;
  try {
    parsed = parseJsonLoose(text) as GeminiVerdictJson;
  } catch {
    throw Object.assign(new Error("ai_bad_response"), { key: "ai_bad_response" });
  }

  const confidenceRaw = String(parsed.confidence || "none").toLowerCase();
  const CONFIDENCE_LEVELS = ["high", "medium", "low", "none"] as const;
  const confidence = (CONFIDENCE_LEVELS as readonly string[]).includes(confidenceRaw)
    ? (confidenceRaw as GeminiVerdict["confidence"])
    : "none";

  const flagged: FlaggedExcerpt[] = Array.isArray(parsed.flagged)
    ? parsed.flagged.slice(0, 20).map((f) => ({
        excerpt: String(f?.excerpt ?? "").slice(0, 300),
        reason: String(f?.reason ?? "").slice(0, 300),
      }))
    : [];

  return {
    verdict: normaliseVerdict(parsed.verdict),
    categories: normaliseCategories(parsed.categories),
    reasons: Array.isArray(parsed.reasons)
      ? parsed.reasons.map((r) => String(r).slice(0, 300)).slice(0, 10)
      : [],
    flagged,
    confidence,
  };
}
