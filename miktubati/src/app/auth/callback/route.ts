import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { readDbEnv } from "@/lib/env";

/** OAuth / email-link landing. Exchanges the code for a session, then routes. */
export async function GET(request: NextRequest) {
  const env = readDbEnv();
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/onboarding";

  if (env.url && env.anonKey && code) {
    const supabase = createServerClient(env.url, env.anonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll() {
          // handled by the redirect response below
        },
      },
    });

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const redirect = new URL(next.startsWith("/") ? next : "/onboarding", origin);
      const res = NextResponse.redirect(redirect);

      // Re-issue the session cookies on the redirect response.
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        const maxAge = Math.floor((session.expires_at ?? 0) - Date.now() / 1000);
        const opts = { path: "/", maxAge: maxAge > 0 ? maxAge : 3600, httpOnly: true, sameSite: "lax" as const };
        res.cookies.set("sb-access-token", session.access_token, opts);
        res.cookies.set("sb-refresh-token", session.refresh_token, opts);
      }
      return res;
    }
  }

  return NextResponse.redirect(new URL("/signin?error=oauth", origin));
}
