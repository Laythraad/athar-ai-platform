import type { NextRequest } from "next/server";
import { adminSupabase } from "@/lib/supabase/admin";
import { serverSupabase } from "@/lib/supabase/server";
import { getSession } from "@/lib/session";
import { sanitizeText } from "@/lib/validation/sanitize";
import { runRules } from "@/lib/moderation/rules";
import { audit, err, ok, configuredAdminEmail } from "@/lib/server/api";
import { readDbEnv } from "@/lib/env";

/* POST /api/onboarding
   Body: { acceptGuidelines: true, fullName: string, username: string,
           bio?: string, avatarUrl?: string }

   Identity:
     • `fullName` is the real 3-part name (الاسم الثلاثي). It is stored in the
       PRIVATE `profile_private` table — never exposed by the public profiles
       policy, and only readable by its owner.
     • `username` is the public unique handle. `pen_name` is kept in sync with
       it so the existing display code keeps working unchanged.

   The guideline acceptance is stored with the version the user saw.
   Email verification is checked first — an unverified address (or a Google
   account that somehow skips verification) can never complete onboarding. */

export async function POST(request: NextRequest) {
  const env = readDbEnv();
  if (!env.url || !env.anonKey) return err(503, "db_not_configured");

  const session = await getSession();
  if (!session.userId) return err(401, "auth_required");
  if (!session.emailVerified) return err(403, "email_unverified");
  if (session.isBlocked) return err(403, "account_blocked");

  let body: {
    acceptGuidelines?: boolean;
    fullName?: string;
    username?: string;
    penName?: string;
    bio?: string;
    avatarUrl?: string;
  };
  try {
    body = await request.json();
  } catch {
    return err(400, "bad_json");
  }

  if (body.acceptGuidelines !== true) return err(400, "guidelines_required");

  // ── full name: the real 3-part name, private ────────────────────
  const fullName = sanitizeText(body.fullName ?? "").replace(/\s+/g, " ").trim();
  const nameParts = fullName.split(" ").filter(Boolean);
  if (nameParts.length < 3) return err(422, "fullname_incomplete");
  if (fullName.length < 6 || fullName.length > 120) return err(422, "fullname_invalid");

  // ── username: public unique handle ──────────────────────────────
  const username = (body.username ?? "").trim().toLowerCase();
  if (!/^[a-z][a-z0-9_.]{2,23}$/.test(username)) return err(422, "username_invalid");

  // Legacy clients may still send penName; keep it as an alias of username.
  const penName = username;

  // Usernames and bios are user content too — same hard-floor rule layer as
  // works. A slurring identity never reaches the database.
  const identityCheck = runRules({ penName: username, bio: body.bio ?? "", fullName });
  if (identityCheck.verdict === "reject") {
    return err(422, "identity_rejected", identityCheck.reasons.join(" | "));
  }

  const admin = adminSupabase();
  if (!admin) return err(503, "service_role_not_configured");

  // 1. uniqueness pre-check (friendly error before the DB constraint fires).
  //    Exclude the caller's own row so re-running onboarding keeps working.
  const { data: taken } = await admin
    .from("profiles")
    .select("id")
    .eq("username", username)
    .neq("id", session.userId)
    .limit(1);
  if (taken && taken.length > 0) return err(409, "username_taken");

  // 2. record guideline acceptance for the version the user was shown
  const latest = session.latestVersion;
  const { error: accErr } = await admin
    .from("guideline_acceptances")
    .upsert({ user_id: session.userId, version: latest }, { onConflict: "user_id,version" });
  if (accErr) return err(500, "onboarding_failed", accErr.message);

  // 3. create (or UPDATE) the public profile — a user re-running onboarding
  //    (e.g. to re-accept a new guideline version) already has a row; an
  //    INSERT would 409 on the primary key, so upsert on id.
  const bio = sanitizeText(body.bio ?? "").slice(0, 500);
  const avatarPath = body.avatarUrl ? sanitizeText(body.avatarUrl).slice(0, 500) : null;

  const { error: profileErr } = await admin.from("profiles").upsert(
    {
      id: session.userId,
      username,
      pen_name: penName,
      bio: bio || null,
      avatar_path: avatarPath || null,
      email_verified: true,
    },
    { onConflict: "id" },
  );

  if (profileErr) {
    if (String(profileErr.code ?? profileErr.message ?? "").includes("23505")) {
      return err(409, "username_taken");
    }
    return err(500, "onboarding_failed", profileErr.message);
  }

  // 4. store the real name in the PRIVATE table (service role only)
  const { error: privErr } = await admin.from("profile_private").upsert(
    { user_id: session.userId, full_name: fullName },
    { onConflict: "user_id" },
  );
  if (privErr) {
    // non-fatal for the public profile, but surface it so it is not silent
    return err(500, "onboarding_failed", privErr.message);
  }

  // 5. grant admin if this is the configured address AND the email is verified.
  //    Both checks live in the Postgres function; this is not client-settable.
  const adminEmail = configuredAdminEmail();
  if (adminEmail && session.email && session.email.trim().toLowerCase() === adminEmail) {
    // supabase-js returns { data, error } — it does not throw, so check it.
    const { error: grantErr } = await admin.rpc("grant_admin_if_config", { p_email: session.email });
    if (grantErr) {
      // non-fatal: the user is a normal member
    }
  }

  await audit({
    actorId: session.userId,
    action: "onboarding_complete",
    targetType: "profile",
    targetId: session.userId,
    after: { username, guidelines_version: latest },
  });

  // 6. also issue the session-scoped client so the browser picks up the profile
  const supabase = await serverSupabase();
  if (supabase) {
    try {
      await supabase.auth.getUser();
    } catch {
      // ignore
    }
  }

  return ok({ username, guidelinesVersion: latest });
}
