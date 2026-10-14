/* AI translation for works (ar ↔ en). On-demand, never persisted — the
   original text is the source of truth; a translation is a courtesy view.

   Long works are translated CHUNK-BY-CHUNK (paragraph windows) so the model
   never truncates mid-work — a single 2000-token call used to cut poems and
   essays in half. Each chunk is a bounded slice of paragraphs; the pieces are
   concatenated in order. */

import { generateText } from "./generate";

export type LangCode = "ar" | "en";

const NAME: Record<LangCode, string> = { ar: "Arabic", en: "English" };

/** Split into paragraph windows of at most ~2600 chars, never cutting a line. */
export function chunkForTranslation(text: string, maxChars = 2600): string[] {
  const paras = text.split(/\n{2,}/);
  const chunks: string[] = [];
  let buf = "";
  for (const p of paras) {
    const candidate = buf ? `${buf}\n\n${p}` : p;
    if (candidate.length > maxChars && buf) {
      chunks.push(buf);
      buf = p;
    } else {
      buf = candidate;
    }
    // a single monster paragraph: hard-split on line breaks / sentences
    while (buf.length > maxChars * 1.5) {
      let cut = buf.lastIndexOf("\n", maxChars);
      if (cut < maxChars * 0.5) cut = buf.lastIndexOf("، ", maxChars);
      if (cut < maxChars * 0.5) cut = buf.lastIndexOf(". ", maxChars);
      if (cut < maxChars * 0.5) cut = maxChars;
      chunks.push(buf.slice(0, cut));
      buf = buf.slice(cut).trimStart();
    }
  }
  if (buf.trim()) chunks.push(buf);
  return chunks.length ? chunks : [text];
}

/** Translate a literary text between Arabic and English, preserving tone. */
export async function translateWork(
  text: string,
  from: LangCode,
  to: LangCode,
  opts: { fetchImpl?: typeof fetch; apiKey?: string; model?: string } = {},
): Promise<string> {
  const full = text.slice(0, 60000); // hard ceiling — huge books stay a courtesy view
  const chunks = chunkForTranslation(full);
  const system = [
    `You are a literary translator between Arabic and English.`,
    `Translate the user's text from ${NAME[from]} to ${NAME[to]}.`,
    "Rules:",
    "- Preserve the author's voice, imagery and register (poetry stays poetic, line breaks survive).",
    "- Do NOT summarise, explain, censor, add notes, or skip any part.",
    "- Translate EVERY line of the given fragment completely.",
    "- Output ONLY the translated fragment. No preamble, no quotes, no markdown.",
  ].join("\n");

  const out: string[] = [];
  for (const c of chunks) {
    const piece = await generateText({
      system,
      user: c,
      temperature: 0.4,
      maxTokens: 4096,
      ...opts,
    });
    out.push(piece);
  }
  return out.join("\n\n");
}

/** Which direction to translate into, given a work's own language. */
export function targetFor(workLang: string): LangCode {
  return workLang === "ar" ? "en" : "ar";
}
