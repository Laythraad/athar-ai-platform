import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { io } from "next/cache";
import { readDbEnv } from "../env";

/**
 * Server Supabase client bound to the request cookies.
 *
 * Next 16: `cookies()` is async and MUST be awaited.
 * Returns null when the project is not configured, so every server code path
 * can degrade honestly instead of throwing.
 *
 * `await io()` keeps Supabase out of the static shell: the auth-js session code
 * reads the wall clock (`Date.now()`), which cacheComponents rejects during
 * prerendering. Suspending here excludes every caller (session reads, queries)
 * from the shell while still allowing client-side prefetch of the result.
 */
export async function serverSupabase() {
  await io();

  const env = readDbEnv();
  if (!env.url || !env.anonKey) return null;

  const cookieStore = await cookies();

  return createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component — middleware refreshes the session.
        }
      },
    },
  });
}
