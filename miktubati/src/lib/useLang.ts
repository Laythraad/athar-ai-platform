"use client";

import { useSyncExternalStore } from "react";
import { type Lang, isLang } from "@/lib/i18n";

function readCookie(): Lang {
  if (typeof document === "undefined") return "ar";
  const match = document.cookie.match(/(?:^|;\s*)mkt_lang=([a-z]{2})\b/);
  if (match && isLang(match[1])) return match[1];
  return "ar";
}

function subscribe(): () => void {
  // The cookie is only written by the language switcher, which triggers a
  // full router refresh — so there is nothing to subscribe to here.
  return () => {};
}

/**
 * Language the visitor picked, read from the cookie.
 * `useSyncExternalStore` keeps SSR and the client hydration in step and avoids
 * a setState-in-effect cascade.
 */
export function useLang(initial: Lang = "ar"): Lang {
  return useSyncExternalStore(subscribe, readCookie, () => initial);
}
