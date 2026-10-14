/* Heritage AI assistant — grounded Q&A over the ported ATHAR Iraq dataset.
   Design goal: NEVER hallucinate. The answer is always built from the real
   records in ./data.ts, then (optionally) polished by Gemini.

   Flow:
     1. retrieve  — score every site against the question (bilingual keyword
                    overlap, name weighted higher). No network, no key needed.
     2. synthesise
          • Gemini configured → ask it to answer USING ONLY the retrieved
            facts, cite the places by name, and admit when the context is
            insufficient. Returns structured JSON.
          • No key / any error  → fall back to an honest "here is what I
            found" list built straight from the records (source: retrieval).

   Fail-open by nature: a missing or broken key degrades to a slightly less
   fluent — but still truthful — answer. It never invents facts. */

import { IRAQ_SITES, type HeritageSite } from "./data";
import { bl, type Lang } from "@/lib/i18n";

export interface HeritageMatch {
  id: string;
  name: string;
  governorate: string;
  summary: string;
  score: number;
}

export interface HeritageAskResult {
  answer: string;
  matches: HeritageMatch[];
  source: "ai" | "retrieval";
  errorKey?: string;
}

/** Split into comparable tokens: lowercase, drop Arabic harakat/tatweel. */
function tokenize(s: string): string[] {
  return String(s || "")
    .toLowerCase()
    .replace(/[\u064B-\u0652\u0640]/g, "")
    .split(/[^\p{L}\p{N}]+/u)
    .filter((t) => t.length > 1);
}

/** All searchable text for a site, bilingual, lightly labelled. */
function haystack(site: HeritageSite): string {
  const parts = [
    site.name.en, site.name.ar,
    site.governorate.en, site.governorate.ar,
    site.city?.en, site.city?.ar,
    site.cat,
    site.era?.en, site.era?.ar,
    site.summary.en, site.summary.ar,
    site.significance.en, site.significance.ar,
    ...(site.tags ?? []),
    ...(site.facts ?? []).flatMap((f) => [f.en, f.ar]),
  ];
  return parts.filter(Boolean).join(" \n ");
}

function norm(s: string): string {
  return String(s || "").toLowerCase().replace(/[\u064B-\u0652\u0640]/g, "");
}

/** Rank every site against the query. Pure, deterministic, key-free. */
export function retrieveHeritage(q: string, limit = 5): HeritageSite[] {
  const query = norm(q);
  if (!query.trim()) return [];

  const qTokens = tokenize(q);
  // Match the raw query as a phrase AND each token (keep tokens of length ≥ 2
  // so short real names like "Ur" still hit; tokenize() already drops length-1).
  const phrases = [query, ...qTokens.filter((t) => t.length >= 2)];

  const scored = IRAQ_SITES.map((site) => {
    const hay = norm(haystack(site));
    const name = norm(`${site.name.en} ${site.name.ar}`);
    let score = 0;

    for (const p of phrases) {
      if (!p) continue;
      const nameHit = name.includes(p) ? 3 : 0;
      // count occurrences in the full haystack
      let count = 0;
      let idx = hay.indexOf(p);
      while (idx !== -1) {
        count++;
        idx = hay.indexOf(p, idx + p.length);
      }
      score += nameHit + count;
    }

    return { site, score };
  })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map((x) => x.site);
}

function toMatch(site: HeritageSite, lang: Lang, score: number): HeritageMatch {
  return {
    id: site.id,
    name: bl(lang, site.name),
    governorate: bl(lang, site.governorate),
    summary: bl(lang, site.summary).slice(0, 180),
    score,
  };
}

/** Build a compact, fact-only context block for the model. */
function buildContext(sites: HeritageSite[]): string {
  return sites
    .map((s, i) => {
      const facts = (s.facts ?? []).slice(0, 4).map((f) => `  - ${f.en} / ${f.ar}`).join("\n");
      return [
        `[${i + 1}] ${s.name.en} / ${s.name.ar}`,
        `    governorate: ${s.governorate.en} / ${s.governorate.ar}`,
        `    era: ${s.era?.en ?? ""} / ${s.era?.ar ?? ""}`,
        `    summary: ${s.summary.en} / ${s.summary.ar}`,
        `    significance: ${s.significance.en} / ${s.significance.ar}`,
        s.visit ? `    visit: ~${s.visit} min` : "",
        facts ? `    facts:\n${facts}` : "",
        s.source?.url ? `    source: ${s.source.title} (${s.source.url})` : "",
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n\n");
}

function parseJsonLoose(raw: string): unknown {
  const s = String(raw || "")
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/, "")
    .replace(/\s*```$/, "");
  const start = s.indexOf("{");
  const end = s.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("ai_bad_response");
  return JSON.parse(s.slice(start, end + 1));
}

const ENDPOINT = (model: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

async function synthesiseWithGemini(
  q: string,
  lang: Lang,
  sites: HeritageSite[],
  opts: { apiKey: string; model: string; fetchImpl?: typeof fetch },
): Promise<string> {
  const fetchImpl = opts.fetchImpl ?? fetch;
  const system = [
    "You are MORS (مورس) — the warm, knowledgeable AI heritage guide of ATHAR IRAQ, inside the MIKTUBATI library app.",
    "Your personality: an Iraqi cultural host — welcoming, precise, a little poetic, never stiff. You love sharing Iraq's sites with travellers, readers and school groups.",
    "Answer the visitor's question using ONLY the FACTS provided in the context below.",
    "Strict rules:",
    "- Use only the given context. If the answer is not in the context, say so plainly and list the closest places you did find.",
    "- Cite places by name. Keep it concise (2-5 sentences) and factual; add one short travel-friendly detail when the context supports it.",
    "- Never invent dates, figures or history that is not in the context.",
    "- Answer in the user's language: " + lang + ".",
    '- Output JSON ONLY: {"answer":"...","used":["place-id-or-name"]}. No markdown.',
  ].join("\n");

  const userText = `CONTEXT:\n${buildContext(sites)}\n\nQUESTION: ${q}`;

  const body = {
    systemInstruction: { parts: [{ text: system }] },
    contents: [{ role: "user", parts: [{ text: userText }] }],
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 700,
      responseMimeType: "application/json",
    },
  };

  const res = await fetchImpl(`${ENDPOINT(opts.model)}?key=${encodeURIComponent(opts.apiKey)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("ai_unavailable");

  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const text = data?.candidates?.[0]?.content?.parts?.map((p) => p?.text ?? "").join("") ?? "";
  const parsed = parseJsonLoose(text) as { answer?: unknown };
  const answer = String(parsed.answer ?? "").trim();
  if (!answer) throw new Error("ai_bad_response");
  return answer;
}

/** Honest fallback built only from the retrieved records. */
function retrievalAnswer(lang: Lang, sites: HeritageSite[]): string {
  if (sites.length === 0) {
    return lang === "ar"
      ? "لم أجد موقعاً مطابقاً في قاعدة بيانات التراث. جرّب اسماً آخر أو محافظة (مثل: بابل، أور، بغداد، البصرة)."
      : "I couldn't find a matching place in the heritage dataset. Try another name or governorate (e.g. Babylon, Ur, Baghdad, Basra).";
  }
  const lines = sites.map((s, i) => {
    const name = bl(lang, s.name);
    const gov = bl(lang, s.governorate);
    const summary = bl(lang, s.summary);
    return `${i + 1}. ${name} — ${gov}: ${summary}`;
  });
  const head =
    lang === "ar"
      ? `وجدتُ ${sites.length} مكاناً مرتبطاً بسؤالك:`
      : `I found ${sites.length} place(s) related to your question:`;
  const note =
    lang === "ar"
      ? "\n\nهذه إجابات من قاعدة بيانات أثَر العراق الموثّقة. أضف مفتاح GEMINI_API_KEY لتفعيل إجابات أدقّ بالذكاء الاصطناعي."
      : "\n\nThese are answers from the sourced ATHAR IRAQ dataset. Add a GEMINI_API_KEY to enable sharper AI-drafted replies.";
  const sign = lang === "ar" ? "\n\n— مورس، دليلك في أثَر العراق" : "\n\n— MORS, your ATHAR Iraq guide";
  return `${head}\n\n${lines.join("\n")}${note}${sign}`;
}

export async function askHeritage(
  q: string,
  lang: Lang,
  opts: {
    apiKey?: string;
    model?: string;
    fetchImpl?: typeof fetch;
    limit?: number;
  } = {},
): Promise<HeritageAskResult> {
  const sites = retrieveHeritage(q, opts.limit ?? 5);
  const matches = sites.map((s, i) => toMatch(s, lang, sites.length - i));

  const apiKey = opts.apiKey ?? process.env.GEMINI_API_KEY ?? "";
  const model = opts.model ?? process.env.GEMINI_MODEL ?? "gemini-flash-lite-latest";

  if (apiKey && sites.length > 0) {
    try {
      const answer = await synthesiseWithGemini(q, lang, sites, {
        apiKey,
        model,
        fetchImpl: opts.fetchImpl,
      });
      return { answer, matches, source: "ai" };
    } catch (e) {
      const key =
        typeof e === "object" && e !== null && "message" in e
          ? String((e as { message: unknown }).message)
          : "ai_unavailable";
      // fall through to retrieval answer
      return { answer: retrievalAnswer(lang, sites), matches, source: "retrieval", errorKey: key };
    }
  }

  return { answer: retrievalAnswer(lang, sites), matches, source: "retrieval" };
}
