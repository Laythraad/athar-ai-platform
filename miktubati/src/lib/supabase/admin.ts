import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { readDbEnv } from "../env";

/**
 * Service-role client. Bypasses RLS — used ONLY on the server for:
 *   • writing moderation/audit rows, role grants, guideline versions
 *   • reading the full moderation queue
 *   • setting work.status (clients can never set it — DB triggers enforce)
 *
 * Never imported from a "use client" file. Never exposed to the browser.
 */
export function adminSupabase(): SupabaseClient | null {
  const env = readDbEnv();
  if (!env.url || !env.serviceRoleKey) return null;

  return createClient(env.url, env.serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
