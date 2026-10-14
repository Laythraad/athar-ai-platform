/* Session resolution for مكتبتي.
 *
 * State machine (checked in this order):
 *   anonymous          → no Supabase user
 *   verify_email       → signed in, email not confirmed
 *   onboarding         → verified, but no profile (pen name not chosen)
 *   reaccept           → profile exists, but a newer guideline version is out
 *   member/mod/admin   → fully onboarded
 *
 * Every step degrades honestly when Supabase is not configured. */

import { serverSupabase } from "./supabase/server";
import { adminSupabase } from "./supabase/admin";
import { isDbConfigured } from "./env";
import { resolveRole, type Role } from "./roles";
import { GUIDELINES_VERSION } from "./guidelines-text";

export type SessionStage =
  | "unconfigured"
  | "anonymous"
  | "verify_email"
  | "onboarding"
  | "reaccept"
  | "member";

export interface ProfileRow {
  id: string;
  pen_name: string;
  bio: string | null;
  avatar_path: string | null;
  author_type: "writer" | "poet" | "historian";
  email_verified: boolean;
  account_status: "active" | "suspended" | "banned";
  created_at: string;
}

export interface SessionSummary {
  stage: SessionStage;
  userId: string | null;
  email: string | null;
  emailVerified: boolean;
  profile: ProfileRow | null;
  role: Role | null;
  accountStatus: "active" | "suspended" | "banned" | null;
  acceptedVersion: number | null;
  latestVersion: number;
  isBlocked: boolean;
}

const ANON: SessionSummary = {
  stage: "anonymous",
  userId: null,
  email: null,
  emailVerified: false,
  profile: null,
  role: null,
  accountStatus: null,
  acceptedVersion: null,
  latestVersion: GUIDELINES_VERSION,
  isBlocked: false,
};

const UNCONFIGURED: SessionSummary = { ...ANON, stage: "unconfigured" };

/** Latest published guideline version. Falls back to the code constant. */
export async function getLatestGuidelineVersion(): Promise<number> {
  const admin = adminSupabase();
  if (!admin) return GUIDELINES_VERSION;
  const { data } = await admin
    .from("guideline_versions")
    .select("version")
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();
  return typeof data?.version === "number" ? data.version : GUIDELINES_VERSION;
}

/** Full session summary for the current request. */
export async function getSession(): Promise<SessionSummary> {
  if (!isDbConfigured()) return UNCONFIGURED;

  const supabase = await serverSupabase();
  if (!supabase) return UNCONFIGURED;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return ANON;

  const email = user.email ?? null;
  const emailVerified = Boolean(user.email_confirmed_at);

  const latestVersion = await getLatestGuidelineVersion();

  if (!emailVerified) {
    return {
      ...ANON,
      stage: "verify_email",
      userId: user.id,
      email,
      emailVerified: false,
      latestVersion,
    };
  }

  const { data: profileRow } = await supabase
    .from("profiles")
    .select(
      "id, pen_name, bio, avatar_path, author_type, email_verified, account_status, created_at",
    )
    .eq("id", user.id)
    .maybeSingle();

  const profile = (profileRow as ProfileRow | null) ?? null;

  if (!profile) {
    return {
      ...ANON,
      stage: "onboarding",
      userId: user.id,
      email,
      emailVerified: true,
      latestVersion,
    };
  }

  let acceptedVersion: number | null = null;
  const { data: acc } = await supabase
    .from("guideline_acceptances")
    .select("version")
    .eq("user_id", user.id)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (typeof acc?.version === "number") acceptedVersion = acc.version;

  const { data: roleRow } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  const role = resolveRole((roleRow?.role as Role | undefined) ?? null, email, emailVerified);
  const accountStatus = profile.account_status;

  if (acceptedVersion !== null && acceptedVersion < latestVersion) {
    return {
      stage: "reaccept",
      userId: user.id,
      email,
      emailVerified: true,
      profile,
      role,
      accountStatus,
      acceptedVersion,
      latestVersion,
      isBlocked: accountStatus !== "active",
    };
  }

  return {
    stage: "member",
    userId: user.id,
    email,
    emailVerified: true,
    profile,
    role,
    accountStatus,
    acceptedVersion,
    latestVersion,
    isBlocked: accountStatus !== "active",
  };
}

/** True when the user may publish: signed in, verified, onboarded, not blocked. */
export function canPublish(s: SessionSummary): boolean {
  return s.stage === "member" && !s.isBlocked;
}
