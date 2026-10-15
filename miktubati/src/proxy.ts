import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { readDbEnv } from "./lib/env";
import { GUIDELINES_VERSION } from "./lib/guidelines-text";

/* مكتبتي + أثَر — session refresh + site-wide route guards.
 *
 * Next 16 convention: this file is `src/proxy.ts` (middleware renamed).
 * The default export runs before every matched request.
 *
 * READ PATHS ARE PUBLIC (tourism/culture decision): the home page, the
 * heritage atlas, the library, work pages, search and guidelines are open to
 * anonymous visitors — a heritage product must be explorable before signup.
 * WRITE PATHS stay gated: /publish, /my, /my-works, /admin, /onboarding and
 * every privileged API re-check the session server-side.
 * After auth it also:
 *   1. refreshes the Supabase session cookie
 *   2. sends unverified users to /verify
 *   3. sends onboarded-less users to /onboarding
 *   4. re-routes when a newer guidelines version is out
 *   5. blocks /admin unless the user holds an admin/moderator role
 *
 * It never *grants* access — every privileged API route re-checks on the
 * server with the service role. Proxy is a convenience gate, not the wall. */

/* Paths reachable without a session. Everything else needs one. */
function isPublic(pathname: string): boolean {
  if (pathname === "/signin" || pathname === "/signup" || pathname === "/verify") return true;
  if (pathname.startsWith("/auth/")) return true; // OAuth / email-link callback
  if (pathname.startsWith("/api/auth")) return true;
  // ── public reading & tourism ──
  if (pathname === "/") return true;
  if (pathname === "/library" || pathname.startsWith("/library?")) return true;
  if (pathname.startsWith("/work/")) return true;
  if (pathname === "/heritage" || pathname.startsWith("/heritage/")) return true;
  if (pathname === "/search" || pathname.startsWith("/search?")) return true;
  if (pathname === "/guidelines") return true;
  if (pathname.startsWith("/author/")) return true;
  // ── ATHAR AI expansion — explorable before signup ──
  if (pathname === "/ai" || pathname.startsWith("/ai?")) return true;
  if (pathname === "/nearby") return true;
  if (pathname === "/travel" || pathname.startsWith("/travel/")) return true;
  if (pathname === "/safety") return true;
  if (pathname === "/kids" || pathname.startsWith("/kids/")) return true;
  if (pathname === "/studio") return true;
  return false;
}

export default async function proxy(request: NextRequest) {
  const env = readDbEnv();
  const { pathname } = request.nextUrl;

  // Not configured: let the app render its honest "connect Supabase" state.
  if (!env.url || !env.anonKey) {
    return NextResponse.next();
  }

  // API routes manage their own auth and return proper 4xx — don't redirect
  // them (a fetch() expects JSON, not an HTML sign-in page).
  const isApi = pathname.startsWith("/api/");
  if (isApi && !isPublic(pathname)) {
    return NextResponse.next();
  }

  if (isPublic(pathname)) {
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/signin";
    url.search = "";
    if (pathname !== "/") url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (!user.email_confirmed_at) {
    const url = request.nextUrl.clone();
    url.pathname = "/verify";
    url.search = "";
    return NextResponse.redirect(url);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, account_status")
    .eq("id", user.id)
    .maybeSingle();

  const onboardingUrl = request.nextUrl.clone();
  onboardingUrl.pathname = "/onboarding";
  onboardingUrl.search = "";

  if (!profile) {
    if (pathname === "/onboarding") return response;
    return NextResponse.redirect(onboardingUrl);
  }

  if (pathname === "/onboarding") {
    // Profile exists — check whether a re-accept is still needed.
    const { data: acc } = await supabase
      .from("guideline_acceptances")
      .select("version")
      .eq("user_id", user.id)
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data: latest } = await supabase
      .from("guideline_versions")
      .select("version")
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();

    const latestVersion = typeof latest?.version === "number" ? latest.version : GUIDELINES_VERSION;
    const accepted = typeof acc?.version === "number" ? acc.version : null;

    if (accepted !== null && accepted >= latestVersion) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      url.search = "";
      return NextResponse.redirect(url);
    }
    return response;
  }

  if (profile.account_status && profile.account_status !== "active") {
    const url = request.nextUrl.clone();
    url.pathname = "/suspended";
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (pathname === "/admin") {
    const { data: roleRow } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();

    const role = roleRow?.role as "member" | "moderator" | "admin" | undefined;

    // Second gate: ADMIN_EMAIL must match and the email must be verified.
    const emailMatchesAdmin =
      env.adminEmail && user.email && user.email.trim().toLowerCase() === env.adminEmail;

    const allowed = role === "admin" || role === "moderator" || emailMatchesAdmin;
    if (!allowed) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match every request path except:
     *  - Next internals (_next/static, _next/image, favicon)
     *  - common static assets (images, fonts, robots.txt)
     * Everything else (pages + API) goes through the guard; API routes that
     * need to self-manage auth return early above.
     */
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map|txt|woff2?)$).*)",
  ],
};
