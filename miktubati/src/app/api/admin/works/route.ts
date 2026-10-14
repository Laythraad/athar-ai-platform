import { NextResponse, type NextRequest } from "next/server";
import { adminSupabase } from "@/lib/supabase/admin";
import { requireRole, err, ok, audit, recordModeration } from "@/lib/server/api";
import { sanitizeText } from "@/lib/validation/sanitize";
import { checkRateLimit, RATE_RULES } from "@/lib/ratings";

/* POST /api/admin/works   Body: { workId, action: "approve"|"reject", reason? }

   Moderator+ only. The decision is written with the SERVICE ROLE, which is
   the only actor permitted to change works.status — clients are blocked by a
   DB trigger. Every decision lands in moderation_events AND audit_log with
   the human's id, so the trail is complete. */

export async function POST(request: NextRequest) {
  const auth = await requireRole("moderator");
  if (auth.error) return auth.error;
  const { session } = auth;

  let body: { workId?: string; action?: string; reason?: string };
  try {
    body = await request.json();
  } catch {
    return err(400, "bad_json");
  }

  const workId = body.workId ?? "";
  const action = body.action ?? "";
  const reason = sanitizeText(body.reason ?? "").slice(0, 500);

  if (!workId) return err(422, "work_required");
  if (!["approve", "reject"].includes(action)) return err(422, "action_invalid");
  if (action === "reject" && reason.trim().length < 3) return err(422, "reason_required");

  const limit = checkRateLimit(session.userId!, RATE_RULES.moderation);
  if (!limit.allowed) {
    return NextResponse.json(
      { ok: false, errorKey: "rate_limited", retryAfterMs: limit.retryAfterMs },
      { status: 429 },
    );
  }

  const admin = adminSupabase();
  if (!admin) return err(503, "service_role_not_configured");

  const { data: work } = await admin
    .from("works")
    .select("id, status, title, author_id")
    .eq("id", workId)
    .maybeSingle();

  if (!work) return err(404, "work_not_found");

  const before = { status: work.status };
  const nextStatus = action === "approve" ? "published" : "rejected";

  const { error: updErr } = await admin
    .from("works")
    .update({
      status: nextStatus,
      rejection_reason: action === "reject" ? reason : null,
      published_at:
        action === "approve" ? (work.status === "published" ? undefined : new Date().toISOString()) : null,
    })
    .eq("id", workId);

  if (updErr) return err(500, "update_failed", updErr.message);

  await recordModeration({
    actorId: session.userId!,
    workId,
    verdict: action === "approve" ? "approve" : "reject",
    source: "human",
    categories: [],
    reasons: reason ? [reason] : [],
    confidence: null,
  });

  await audit({
    actorId: session.userId!,
    action: `work_${action}`,
    targetType: "work",
    targetId: workId,
    before,
    after: { status: nextStatus },
    reason: reason || null,
  });

  return ok({ status: nextStatus });
}
