/* Environment access for مكتبتي.
   The app must boot (and stay honest) even when Supabase is not configured —
   every caller checks `isDbConfigured()` before touching the database.

   IMPORTANT (Next.js): `NEXT_PUBLIC_*` values are inlined into the BROWSER
   bundle only when read as a static literal like
   `process.env.NEXT_PUBLIC_SUPABASE_URL`. A dynamic lookup
   (`process.env[name]`) is NOT inlined and is `undefined` in the browser —
   which would make the client think the DB is unconfigured. So every
   NEXT_PUBLIC_ var below is accessed as a static literal on purpose. */

export interface DbEnv {
  url: string;
  anonKey: string;
  serviceRoleKey: string;
  adminEmail: string;
  geminiApiKey: string;
  geminiModel: string;
  siteUrl: string;
  atharUrl: string;
}

function trim(v: string | undefined): string {
  return v && v.trim() ? v.trim() : "";
}

export function readDbEnv(): DbEnv {
  return {
    // public — inlined into the browser bundle (static literals on purpose)
    url: trim(process.env.NEXT_PUBLIC_SUPABASE_URL),
    anonKey: trim(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    // server-only — never reaches the browser regardless of access style
    serviceRoleKey: trim(process.env.SUPABASE_SERVICE_ROLE_KEY),
    adminEmail: trim(process.env.ADMIN_EMAIL).toLowerCase(),
    geminiApiKey: trim(process.env.GEMINI_API_KEY),
    geminiModel: trim(process.env.GEMINI_MODEL) || "gemini-flash-lite-latest",
    siteUrl: trim(process.env.NEXT_PUBLIC_SITE_URL) || "http://localhost:3000",
    atharUrl: trim(process.env.NEXT_PUBLIC_ATHAR_URL) || "../site/index.html",
  };
}

/** True when both public Supabase values are present. */
export function isDbConfigured(): boolean {
  const e = readDbEnv();
  return Boolean(e.url && e.anonKey);
}

/** True when the server can use the service-role key (admin operations). */
export function isServiceRoleConfigured(): boolean {
  return Boolean(readDbEnv().serviceRoleKey);
}

/** True when Gemini can actually be called. */
export function isGeminiConfigured(): boolean {
  return Boolean(readDbEnv().geminiApiKey);
}

/** Human-readable reason the DB is unavailable (for honest UI copy). */
export function dbUnavailableReason(): "missing_env" | null {
  return isDbConfigured() ? null : "missing_env";
}
