import { NextResponse, type NextRequest } from "next/server";
import { adminSupabase } from "@/lib/supabase/admin";
import { requireRole, err, ok, audit } from "@/lib/server/api";
import { sanitizeText } from "@/lib/validation/sanitize";
import { checkRateLimit, RATE_RULES } from "@/lib/ratings";
import { GUIDELINES_VERSION } from "@/lib/guidelines-text";

/* POST /api/admin/guidelines   Body: { contentAr, contentEn }

   Admin-only. Publishes a NEW immutable guideline version. Existing
   acceptances are NOT migrated — every member is routed back through
   /onboarding to accept the new version (session.ts `reaccept` stage).
   Acceptance rows are never rewritten, so the audit trail stays honest. */

export async function POST(request: NextRequest) {
  const auth = await requireRole("admin");
  if (auth.error) return auth.error;
  const { session } = auth;

  let body: { contentAr?: string; contentEn?: string };
  try {
    body = await request.json();
  } catch {
    return err(400, "bad_json");
  }

  const contentAr = sanitizeText(body.contentAr ?? "").slice(0, 20_000).trim();
  const contentEn = sanitizeText(body.contentEn ?? "").slice(0, 20_000).trim();

  if (contentAr.length < 50) return err(422, "body_too_short");
  if (contentEn.length < 50) return err(422, "body_too_short");

  const limit = checkRateLimit(session.userId!, RATE_RULES.moderation);
  if (!limit.allowed) {
    return NextResponse.json(
      { ok: false, errorKey: "rate_limited", retryAfterMs: limit.retryAfterMs },
      { status: 429 },
    );
  }

  const admin = adminSupabase();
  if (!admin) return err(503, "service_role_not_configured");

  const { data: latest } = await admin
    .from("guideline_versions")
    .select("version")
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  const current = typeof latest?.version === "number" ? latest.version : GUIDELINES_VERSION;
  const next = current + 1;

  const { error: insertErr } = await admin.from("guideline_versions").insert({
    version: next,
    content_ar: contentAr,
    content_en: contentEn,
    active: true,
    created_by: session.userId!,
  });

  if (insertErr) {
    if (String(insertErr.code ?? "").includes("23505")) return err(409, "version_exists");
    return err(500, "publish_failed", insertErr.message);
  }

  await audit({
    actorId: session.userId!,
    action: "guidelines_published",
    targetType: "guideline_version",
    targetId: String(next),
    before: { version: current },
    after: { version: next },
  });

  return ok({ version: next }, 201);
}
