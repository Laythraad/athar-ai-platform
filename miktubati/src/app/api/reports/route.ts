import { NextResponse, type NextRequest } from "next/server";
import { serverSupabase } from "@/lib/supabase/server";
import { adminSupabase } from "@/lib/supabase/admin";
import { requireUser, err, ok, audit } from "@/lib/server/api";
import { sanitizeText } from "@/lib/validation/sanitize";
import { checkRateLimit, RATE_RULES } from "@/lib/ratings";

/* POST /api/reports  Body: { targetType: "work"|"author"|"review", targetId, reason }

   Reports are insertable by any signed-in user (RLS allows it), but we still
   route through the API so we can rate-limit and audit. Resolution is
   service-role only — a reporter can never mark their own report resolved. */

export async function POST(request: NextRequest) {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const { session } = auth;

  let body: { targetType?: string; targetId?: string; reason?: string };
  try {
    body = await request.json();
  } catch {
    return err(400, "bad_json");
  }

  const targetType = body.targetType ?? "";
  const targetId = body.targetId ?? "";
  const reason = sanitizeText(body.reason ?? "").slice(0, 500).trim();

  if (!["work", "author", "review"].includes(targetType)) return err(422, "target_type_invalid");
  if (!targetId) return err(422, "target_required");
  if (reason.length < 1) return err(422, "reason_required");

  const limit = checkRateLimit(session.userId!, RATE_RULES.report);
  if (!limit.allowed) {
    return NextResponse.json(
      { ok: false, errorKey: "rate_limited", retryAfterMs: limit.retryAfterMs },
      { status: 429 },
    );
  }

  const supabase = await serverSupabase();
  if (!supabase) return err(503, "db_not_configured");

  // Confirm the target exists BEFORE inserting, so we never create orphan
  // reports pointing at rows that don't exist.
  const admin = adminSupabase();
  if (admin && targetType === "work") {
    const { data } = await admin.from("works").select("id").eq("id", targetId).maybeSingle();
    if (!data) return err(404, "work_not_found");
  }

  const { error: insertErr } = await supabase.from("reports").insert({
    reporter_id: session.userId!,
    target_type: targetType,
    target_id: targetId,
    reason,
  });

  if (insertErr) return err(500, "report_failed", insertErr.message);

  await audit({
    actorId: session.userId!,
    action: "report_created",
    targetType,
    targetId,
    after: { reason },
  });

  return ok({}, 201);
}
