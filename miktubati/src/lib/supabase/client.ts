"use client";

import { createBrowserClient } from "@supabase/ssr";
import { readDbEnv } from "../env";

/** Browser Supabase client. Null until the project is configured. */
export function browserSupabase() {
  const env = readDbEnv();
  if (!env.url || !env.anonKey) return null;
  return createBrowserClient(env.url, env.anonKey);
}
