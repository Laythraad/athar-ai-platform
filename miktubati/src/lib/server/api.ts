/* Server-only helpers shared by every API route.
 *
 * Rules enforced here (and again in Postgres):
 *   • no user  → 401
 *   • suspended/banned → 403
 *   • role checks are server-side; the client can never assert a role
 *   • every privileged action writes an audit row
 *
 * Nothing in this file may be imported from a "use client" component. */

import { NextResponse } from "next/server";
import { getSession, type SessionSummary } from "../session";
import { adminSupabase } from "../supabase/admin";
import { isRoleAtLeast, type Role } from "../roles";
import { readDbEnv } from "../env";

export interface ApiError {
  status: number;
  body: { ok: false; errorKey: string; message?: string };
}

export function err(status: number, errorKey: string, message?: string): NextResponse {
  return NextResponse.json({ ok: false, errorKey, message }, { status });
}

export function ok(body: Record<string, unknown> = {}, status = 200): NextResponse {
  return NextResponse.json({ ok: true, ...body }, { status });
}

/** Resolve the caller, or return null with a ready-to-send error response. */
export async function requireUser(): Promise<
  { session: SessionSummary; error: null } | { session: null; error: NextResponse }
> {
  const s = await getSession();
  if (!s.userId) return { session: null, error: err(401, "auth_required") };
  if (!s.emailVerified) return { session: null, error: err(403, "email_unverified") };
  if (s.isBlocked) return { session: null, error: err(403, "account_blocked") };
  if (s.stage !== "member") return { session: null, error: err(403, "onboarding_required") };
  return { session: s, error: null };
}

/** Require at least `role`. Uses the same server-side resolution as proxy.ts. */
export async function requireRole(
  role: Role,
): Promise<
  { session: SessionSummary; error: null } | { session: null; error: NextResponse }
> {
  const r = await requireUser();
  if (r.error) return r;
  if (!isRoleAtLeast(r.session.role, role)) {
    return { session: null, error: err(403, "forbidden") };
  }
  return { session: r.session, error: null };
}

/** Write an audit row. Never throws — auditing must not break the request. */
export async function audit(params: {
  actorId: string;
  action: string;
  targetType: string;
  targetId: string | null;
  before?: unknown;
  after?: unknown;
  reason?: string | null;
}): Promise<void> {
  const admin = adminSupabase();
  if (!admin) return;
  try {
    const meta: Record<string, unknown> = {};
    if (params.before !== undefined) meta.before = params.before;
    if (params.after !== undefined) meta.after = params.after;
    // supabase-js returns { error } — it does not throw, so check it.
    const { error } = await admin.from("audit_log").insert({
      actor_id: params.actorId,
      action: params.action,
      target_type: params.targetType,
      target_id: params.targetId,
      reason: params.reason ?? null,
      meta,
    });
    if (error) {
      console.error("[audit] insert failed:", error.message);
    }
  } catch (e) {
    // auditing is best-effort; the action itself already succeeded
    console.error("[audit] unexpected throw:", e);
  }
}

/** Record a moderation decision against a work. */
export async function recordModeration(params: {
  actorId: string | null;
  workId: string;
  verdict: "approve" | "reject" | "needs_human_review";
  source: "rules" | "ai" | "human" | "system";
  categories: string[];
  reasons: string[];
  flagged?: unknown;
  confidence?: string | null;
}): Promise<void> {
  const admin = adminSupabase();
  if (!admin) return;
  try {
    const { error } = await admin.from("moderation_events").insert({
      target_type: "work",
      target_id: params.workId,
      verdict: params.verdict,
      source: params.source,
      categories: params.categories,
      reasons: params.reasons,
      flagged: params.flagged ?? [],
      confidence: params.confidence ?? null,
      actor_id: params.actorId,
    });
    if (error) {
      console.error("[moderation] insert failed:", error.message);
    }
  } catch (e) {
    console.error("[moderation] unexpected throw:", e);
  }
}

/** ADMIN_EMAIL for the grant_admin RPC call. */
export function configuredAdminEmail(): string {
  return readDbEnv().adminEmail;
}
