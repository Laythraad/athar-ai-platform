/* Server-side role helpers.
 *
 * Roles are the source of truth in `public.user_roles`, which has NO client
 * write policies — only the service role can change them.
 *
 * The single ADMIN_EMAIL is a second, independent gate: even if a row exists,
 * the email must match ADMIN_EMAIL AND be verified. Checked on the server and
 * enforced again inside the `grant_admin_if_config` Postgres function. */

import { readDbEnv } from "./env";

export type Role = "member" | "moderator" | "admin";

const ROLE_RANK: Record<Role, number> = { member: 0, moderator: 1, admin: 2 };

export function isRoleAtLeast(actual: Role | null | undefined, required: Role): boolean {
  if (!actual) return false;
  return ROLE_RANK[actual] >= ROLE_RANK[required];
}

/** Admin only if the email matches ADMIN_EMAIL and the email is verified. */
export function isAdminEmail(email: string | null | undefined, emailVerified: boolean): boolean {
  const env = readDbEnv();
  if (!env.adminEmail) return false;
  if (!emailVerified) return false;
  return Boolean(email) && email!.trim().toLowerCase() === env.adminEmail;
}

/** Resolve the effective role for a user, given their DB role row. */
export function resolveRole(
  dbRole: Role | null | undefined,
  email: string | null | undefined,
  emailVerified: boolean,
): Role {
  if (isAdminEmail(email, emailVerified)) return "admin";
  if (dbRole === "admin" || dbRole === "moderator") return dbRole;
  return "member";
}

/** Route guards — used by proxy.ts and by every privileged API route. */
export const GUARD = {
  library: "library",
  onboarding: "onboarding",
  publish: "publish",
  admin: "admin",
  moderator: "moderator",
} as const;

export type Guard = (typeof GUARD)[keyof typeof GUARD];

export function requiredRoleFor(guard: Guard): Role | null {
  switch (guard) {
    case "admin":
      return "admin";
    case "moderator":
      return "moderator";
    default:
      return null;
  }
}
