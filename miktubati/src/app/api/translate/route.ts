import type { NextRequest } from "next/server";
import { err, ok, requireUser } from "@/lib/server/api";
import { fetchWork } from "@/lib/queries";
import { translateWork, targetFor, type LangCode } from "@/lib/ai/translate";
import { isGeminiConfigured } from "@/lib/env";

/* POST /api/translate   Body: { id: workId, to?: "ar"|"en" }

   On-demand literary translation of a work, ar ↔ en. Uses the user-scoped
   query so Postgres RLS decides visibility (published works, or your own).
   The translation is computed and returned — never stored; the original is
   the source of truth. Requires Gemini; returns 503 if it isn't configured. */

const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 8;
const hits = new Map<string, { count: number; reset: number }>();
function rateLimited(userId: string | null): boolean {
  if (!userId) return false;
  const now = Date.now();
  const e = hits.get(userId);
  if (!e || now > e.reset) { hits.set(userId, { count: 1, reset: now + WINDOW_MS }); return false; }
  e.count += 1;
  return e.count > MAX_PER_WINDOW;
}

export async function POST(request: NextRequest) {
  const { session, error } = await requireUser();
  if (error) return error;
  if (!isGeminiConfigured()) return err(503, "ai_not_configured");
  if (rateLimited(session.userId)) return err(429, "rate_limited");

  let body: { id?: unknown; to?: unknown };
  try {
    body = await request.json();
  } catch {
    return err(400, "bad_json");
  }

  const id = typeof body.id === "string" ? body.id : "";
  if (!id) return err(422, "id_required");

  const work = await fetchWork(id);
  if (!work) return err(404, "work_not_found");

  const source = (work.content || work.description || "").trim();
  if (!source) return err(422, "empty_content");

  const from: LangCode = work.language === "en" ? "en" : "ar";
  const to: LangCode =
    body.to === "ar" || body.to === "en" ? (body.to as LangCode) : targetFor(from);
  if (to === from) return err(422, "same_language");

  try {
    const translated = await translateWork(source, from, to);
    return ok({ translated, from, to });
  } catch (e) {
    const key =
      typeof e === "object" && e !== null && "message" in e
        ? String((e as { message: unknown }).message)
        : "ai_unavailable";
    return err(502, key);
  }
}
