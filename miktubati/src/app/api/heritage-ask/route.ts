import type { NextRequest } from "next/server";
import { err, ok, requireUser } from "@/lib/server/api";
import { readDbEnv, isGeminiConfigured } from "@/lib/env";
import { askHeritage } from "@/lib/heritage/ask";
import { sanitizeText } from "@/lib/validation/sanitize";
import type { Lang } from "@/lib/i18n";

/* POST /api/heritage-ask   Body: { q: string, lang?: "ar"|"en" }

   Grounded Q&A over the ATHAR Iraq heritage dataset. The answer is always
   built from the real records; Gemini (free tier) only polishes the wording
   when a key is configured. Without a key it degrades to an honest
   "here's what I found" list — it never invents facts.

   Auth: any signed-in member (the whole site is gated). A small per-user
   in-memory rate limit protects the free Gemini quota from being burned. */

const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 12;
const hits = new Map<string, { count: number; reset: number }>();

function rateLimited(userId: string | null): boolean {
  if (!userId) return false;
  const now = Date.now();
  const e = hits.get(userId);
  if (!e || now > e.reset) {
    hits.set(userId, { count: 1, reset: now + WINDOW_MS });
    return false;
  }
  e.count += 1;
  return e.count > MAX_PER_WINDOW;
}

export async function POST(request: NextRequest) {
  const { session, error } = await requireUser();
  if (error) return error;

  if (rateLimited(session.userId)) {
    return err(429, "rate_limited", "Too many questions this minute.");
  }

  let body: { q?: unknown; lang?: unknown };
  try {
    body = await request.json();
  } catch {
    return err(400, "bad_json");
  }

  const q = sanitizeText(String(body.q ?? "")).slice(0, 400).trim();
  if (q.length < 2) return err(422, "query_too_short");

  const lang: Lang = body.lang === "en" ? "en" : "ar";
  const env = readDbEnv();

  const result = await askHeritage(q, lang, {
    apiKey: env.geminiApiKey || undefined,
    model: env.geminiModel || undefined,
  });

  return ok({
    answer: result.answer,
    matches: result.matches,
    source: result.source,
    aiEnabled: isGeminiConfigured(),
  });
}
