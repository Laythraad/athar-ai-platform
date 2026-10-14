import { NextResponse, type NextRequest } from "next/server";
import { adminSupabase } from "@/lib/supabase/admin";
import { requireRole, err, ok, audit } from "@/lib/server/api";
import { sanitizeText } from "@/lib/validation/sanitize";
import { checkRateLimit, RATE_RULES } from "@/lib/ratings";

/* POST /api/admin/reports   Body: { reportId, action: "resolve"|"dismiss", reason? }

   Moderator+ only. Reports are read-only for reporters and are closed here.
   "dismiss" = no violation found; "resolve" = the report was acted on (the
   underlying work action happens separately via /api/admin/works).
   The resolution and the acting human are both recorded — reports can never
   be silently reopened or deleted. */

export async function POST(request: NextRequest) {
  const auth = await requireRole("moderator");
  if (auth.error) return auth.error;
  const { session } = auth;

  let body: { reportId?: string; action?: string; reason?: string };
  try {
    body = await request.json();
  } catch {
    return err(400, "bad_json");
  }

  const reportId = body.reportId ?? "";
  const action = body.action ?? "";
  const reason = sanitizeText(body.reason ?? "").slice(0, 500);

  if (!reportId) return err(422, "report_required");
  if (!["resolve", "dismiss"].includes(action)) return err(422, "action_invalid");

  const limit = checkRateLimit(session.userId!, RATE_RULES.moderation);
  if (!limit.allowed) {
    return NextResponse.json(
      { ok: false, errorKey: "rate_limited", retryAfterMs: limit.retryAfterMs },
      { status: 429 },
    );
  }

  const admin = adminSupabase();
  if (!admin) return err(503, "service_role_not_configured");

  const { data: report } = await admin
    .from("reports")
    .select("id, status, target_type, target_id, reason")
    .eq("id", reportId)
    .maybeSingle();

  if (!report) return err(404, "report_not_found");
  if (report.status !== "open") return err(409, "already_resolved");

  const resolution =
    action === "dismiss"
      ? reason.trim() || "No violation found."
      : reason.trim() || "Action taken.";

  const { error: updErr } = await admin
    .from("reports")
    .update({
      status: action === "dismiss" ? "dismissed" : "resolved",
      resolution,
      resolved_at: new Date().toISOString(),
    })
    .eq("id", reportId)
    .eq("status", "open");

  if (updErr) return err(500, "update_failed", updErr.message);

  await audit({
    actorId: session.userId!,
    action: `report_${action === "dismiss" ? "dismissed" : "resolved"}`,
    targetType: "report",
    targetId: reportId,
    before: { status: "open" },
    after: { status: action === "dismiss" ? "dismissed" : "resolved" },
    reason: resolution,
  });

  return ok({ status: action === "dismiss" ? "dismissed" : "resolved" });
}
