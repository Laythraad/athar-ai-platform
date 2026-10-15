import { type NextRequest } from "next/server";
import { requireUser, err, ok } from "@/lib/server/api";
import { askAthar } from "@/lib/ai/athar";
import { isLang, type Lang } from "@/lib/i18n";
import { sanitizeText } from "@/lib/validation/sanitize";
import { checkRateLimit } from "@/lib/ratings";

/* POST /api/athar-ai  { q, lang?, web? } → unified assistant answer.
   Auth: any signed-in member (the chat is a platform feature; the answer
   itself never exposes other users' private data). Rate limited per user. */

export async function POST(request: NextRequest) {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  const rl = checkRateLimit(`athar-ai:${auth.session.userId}`, { action: "athar_ai", limit: 20, windowMs: 60_000 });
  if (!rl.allowed) return err(429, "rate_limited");

  let body: { q?: unknown; lang?: unknown; web?: unknown };
  try {
    body = await request.json();
  } catch {
    return err(400, "bad_json");
  }

  const q = sanitizeText(typeof body.q === "string" ? body.q : "").slice(0, 1200).trim();
  if (q.length < 2) return err(422, "query_too_short");

  const lang: Lang = isLang(body.lang) ? (body.lang as Lang) : "ar";
  const web = body.web !== false;

  const result = await askAthar(q, lang, { web });
  return ok({
    answer: result.answer,
    mode: result.mode,
    citations: result.citations,
    webResults: result.webResults.map((r) => ({
      title: r.title,
      url: r.url,
      snippet: r.snippet,
      publishedAt: r.publishedAt ?? null,
      source: r.source,
    })),
    guidance: result.guidance ?? null,
    errorKey: result.errorKey ?? null,
  });
}
