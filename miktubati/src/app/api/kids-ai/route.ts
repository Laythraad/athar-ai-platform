import { type NextRequest } from "next/server";
import { requireUser, err, ok } from "@/lib/server/api";
import { generateText } from "@/lib/ai/generate";
import { isGeminiConfigured } from "@/lib/env";
import { sanitizeText } from "@/lib/validation/sanitize";
import { checkRateLimit } from "@/lib/ratings";
import { isLang } from "@/lib/i18n";

/* POST /api/kids-ai — children's assistant.
   Safety rules (product spec §4 + §7):
     • strict system prompt: age-appropriate, educational, cultural topics only
     • refuse anything off-topic or unsafe — the model is instructed to
       answer with a fixed refusal string
     • never ask for or accept personal data
     • no private messaging, no publishing
     • signed-in users only (parental gate via account)                       */

const REFUSAL_EN = "Let's talk about history, geography, animals, or books instead!";
const REFUSAL_AR = "لنتحدث عن التاريخ أو الجغرافيا أو الحيوانات أو الكتب بدلاً من ذلك!";

const BLOCK_AR = /(عنوان|عنواني|رقم|هاتف|واتساب|فيسبوك|انستغرام|مدرست|حيك|أرسل|ابعث لي|موقعك|سن أبوي|usename|username|phone|address|whatsapp|instagram|facebook|my school|my address|send me|private message)/i;
const BLOCK_EN = /\b(address|phone number|whatsapp|instagram|facebook|my school|my address|send me (a )?(photo|picture)|meet me|private message|where do you live|how old are you exactly)\b/i;

export async function POST(request: NextRequest) {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  const rl = checkRateLimit(`kids-ai:${auth.session.userId}`, { action: "kids_ai", limit: 10, windowMs: 60_000 });
  if (!rl.allowed) return err(429, "rate_limited");

  let body: { q?: unknown; lang?: unknown };
  try {
    body = await request.json();
  } catch {
    return err(400, "bad_json");
  }

  const q = sanitizeText(typeof body.q === "string" ? body.q : "").slice(0, 500).trim();
  if (q.length < 2) return err(422, "query_too_short");

  // hard client-side-independent guard before spending a model call
  if (BLOCK_AR.test(q) || BLOCK_EN.test(q)) {
    return ok({ answer: isLang(body.lang) && body.lang === "ar" ? REFUSAL_AR : REFUSAL_EN, blocked: true });
  }

  if (!isGeminiConfigured()) return err(503, "ai_not_configured");

  const lang = isLang(body.lang) && body.lang === "ar" ? "ar" : "en";
  const refusal = lang === "ar" ? REFUSAL_AR : REFUSAL_EN;

  const system =
    `You are the ATHAR Kids guide for children aged 6-12 (team Mors). ` +
    `Answer in ${lang === "ar" ? "simple Arabic" : "simple English"}. ` +
    `ONLY help with: history for kids, geography, animals, nature, books, reading, art, and safe science. ` +
    `Encourage curiosity: ask the child a follow-up thinking question instead of only giving answers. ` +
    `NEVER ask for or discuss personal information (name, address, school, phone, photos, family details). ` +
    `If the question is about anything else, or unsafe, reply with exactly this sentence and nothing else: "${refusal}". ` +
    `Keep answers under 120 words. Be warm and positive.`;

  try {
    const answer = await generateText({ system, user: q, maxTokens: 400, temperature: 0.5 });
    const finalAnswer = answer.trim().slice(0, 1500);
    // second-pass guard: if the model went off rails, fall back to refusal
    if (BLOCK_AR.test(finalAnswer) || BLOCK_EN.test(finalAnswer)) {
      return ok({ answer: refusal, blocked: true });
    }
    return ok({ answer: finalAnswer, blocked: false });
  } catch {
    return err(503, "ai_unavailable");
  }
}
