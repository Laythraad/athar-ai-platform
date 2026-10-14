/* AI enrichment on publish — suggests concise tags for a work.
   Tags are merged with (never overwrite) the author's own; they power the
   library's search and browsing. Purely additive and non-blocking: if the AI
   fails, the work publishes exactly as the author submitted it. */

import { generateJson } from "./generate";

export interface EnrichInput {
  title: string;
  description?: string | null;
  content?: string | null;
  language?: string;
}

/** Return 3–6 short topic/genre tags, or [] on any failure. */
export async function suggestTags(
  input: EnrichInput,
  opts: { fetchImpl?: typeof fetch; apiKey?: string; model?: string } = {},
): Promise<string[]> {
  const lang = input.language === "en" ? "en" : "ar";
  const system = [
    "You tag literary works for an Arabic cultural library.",
    "Return 3 to 6 concise tags describing the work's themes, genre and mood.",
    "Rules:",
    "- Each tag: 1–3 words, no hashtags, no punctuation.",
    `- Write tags in ${lang === "ar" ? "Arabic" : "English"}.`,
    "- Do not invent facts; base tags only on the given text.",
    '- Output JSON ONLY: {"tags":["tag1","tag2"]}.',
  ].join("\n");

  const user = [
    `TITLE: ${input.title}`,
    input.description ? `DESCRIPTION: ${input.description.slice(0, 500)}` : "",
    input.content ? `CONTENT:\n${input.content.slice(0, 4000)}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  try {
    const parsed = await generateJson<{ tags?: unknown }>({
      system,
      user,
      temperature: 0.3,
      maxTokens: 120,
      ...opts,
    });
    if (!Array.isArray(parsed.tags)) return [];
    return parsed.tags
      .map((t) => String(t).trim().replace(/^#/, ""))
      .filter((t) => t.length >= 2 && t.length <= 30)
      .slice(0, 6);
  } catch {
    return [];
  }
}

/** Merge author tags + AI tags, de-duplicated, capped, case-insensitive. */
export function mergeTags(author: string[], ai: string[], cap = 10): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const t of [...author, ...ai]) {
    const clean = String(t || "").trim();
    if (!clean) continue;
    const key = clean.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(clean);
    if (out.length >= cap) break;
  }
  return out;
}
