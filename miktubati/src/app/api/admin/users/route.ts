import { NextResponse, type NextRequest } from "next/server";
import { adminSupabase } from "@/lib/supabase/admin";
import {
  requireRole,
  err,
  ok,
  audit,
  configuredAdminEmail,
} from "@/lib/server/api";
import { sanitizeText } from "@/lib/validation/sanitize";
import { checkRateLimit, RATE_RULES } from "@/lib/ratings";
import { isAdminEmail, type Role } from "@/lib/roles";

/* POST /api/admin/users
   Body: { userId, action, reason? }

   action:
     "appoint_mod"   → grant moderator        (ADMIN only)
     "remove_mod"    → revoke moderator role  (ADMIN only)
     "suspend"       → account_status=suspended (moderator+)
     "unban"         → account_status=active    (moderator+)
     "ban"           → account_status=banned    (ADMIN only)

   Role changes and bans are ADMIN-only because they change who can act on
   other people. Suspension is available to moderators so a spam wave can be
   stopped without waiting.

   Hard protections, checked here and re-checked in Postgres:
     • you can never act on your own account (no self-demote / self-ban)
     • you can never act on the ADMIN_EMAIL account
     • you can never strip the admin role from the last remaining admin row */

type UserAction = "appoint_mod" | "remove_mod" | "suspend" | "unban" | "ban";

const ADMIN_ONLY: UserAction[] = ["appoint_mod", "remove_mod", "ban"];

export async function POST(request: NextRequest) {
  const auth = await requireRole("moderator");
  if (auth.error) return auth.error;
  const { session } = auth;

  let body: { userId?: string; action?: string; reason?: string };
  try {
    body = await request.json();
  } catch {
    return err(400, "bad_json");
  }

  const targetId = body.userId ?? "";
  const action = body.action as UserAction | undefined;
  const reason = sanitizeText(body.reason ?? "").slice(0, 500);

  if (!targetId) return err(422, "user_required");
  if (
    !action ||
    !["appoint_mod", "remove_mod", "suspend", "unban", "ban"].includes(action)
  ) {
    return err(422, "action_invalid");
  }

  // Ban and role changes require full admin.
  if (ADMIN_ONLY.includes(action) && session.role !== "admin") {
    return err(403, "forbidden");
  }

  if (action === "ban" && reason.trim().length < 3) {
    return err(422, "reason_required");
  }

  if (targetId === session.userId) return err(400, "cannot_act_on_self");

  const limit = checkRateLimit(session.userId!, RATE_RULES.moderation);
  if (!limit.allowed) {
    return NextResponse.json(
      { ok: false, errorKey: "rate_limited", retryAfterMs: limit.retryAfterMs },
      { status: 429 },
    );
  }

  const admin = adminSupabase();
  if (!admin) return err(503, "service_role_not_configured");

  // Load the target's profile + role + auth email in one pass.
  const [{ data: profile }, { data: roleRow }, { data: targetAuth }] =
    await Promise.all([
      admin
        .from("profiles")
        .select("id, pen_name, account_status")
        .eq("id", targetId)
        .maybeSingle(),
      admin.from("user_roles").select("role").eq("user_id", targetId).maybeSingle(),
      admin.auth.admin.getUserById(targetId),
    ]);

  if (!profile) return err(404, "user_not_found");

  const targetEmail =
    targetAuth?.user?.email?.trim().toLowerCase() ?? null;

  // The ADMIN_EMAIL account is untouchable by any moderator action.
  const protectedEmail = configuredAdminEmail();
  if (
    protectedEmail &&
    ((targetEmail && targetEmail === protectedEmail) || isAdminEmail(targetEmail, true))
  ) {
    return err(403, "user_protected");
  }

  const before = {
    account_status: profile.account_status,
    role: (roleRow?.role as Role | undefined) ?? "member",
  };

  if (action === "appoint_mod" || action === "remove_mod") {
    const nextRole: Role = action === "appoint_mod" ? "moderator" : "member";

    // Never remove the last admin role row.
    if (action === "remove_mod" && before.role === "admin") {
      const { count } = await admin
        .from("user_roles")
        .select("user_id", { count: "exact", head: true })
        .eq("role", "admin");
      if ((count ?? 0) <= 1) return err(400, "last_admin");
    }

    const { error: roleErr } = await admin.from("user_roles").upsert(
      {
        user_id: targetId,
        role: nextRole,
        granted_by: session.userId!,
        granted_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );
    if (roleErr) return err(500, "update_failed", roleErr.message);

    await audit({
      actorId: session.userId!,
      action: action === "appoint_mod" ? "role_granted" : "role_revoked",
      targetType: "user",
      targetId,
      before,
      after: { ...before, role: nextRole },
      reason: reason || null,
    });

    return ok({ role: nextRole });
  }

  const nextStatus =
    action === "suspend" ? "suspended" : action === "ban" ? "banned" : "active";

  const { error: statusErr } = await admin
    .from("profiles")
    .update({ account_status: nextStatus, updated_at: new Date().toISOString() })
    .eq("id", targetId);
  if (statusErr) return err(500, "update_failed", statusErr.message);

  await audit({
    actorId: session.userId!,
    action: `account_${nextStatus}`,
    targetType: "user",
    targetId,
    before,
    after: { ...before, account_status: nextStatus },
    reason: reason || null,
  });

  return ok({ accountStatus: nextStatus });
}
