import { cookies } from "next/headers";
import { type Lang, isLang } from "./i18n";

/**
 * Read the language the visitor picked (written by the client switcher).
 * Used by every server page so page BODIES follow the switch, not just the shell.
 * Default is Arabic — it is the primary language of this product.
 */
export async function getCurrentLang(): Promise<Lang> {
  const store = await cookies();
  const v = store.get("mkt_lang")?.value;
  return isLang(v) ? v : "ar";
}

/** Locale-aware date formatter for every supported UI language. */
const DATE_LOCALES: Record<Lang, string> = {
  ar: "ar-IQ", en: "en-GB", ku: "ckb-IQ", fa: "fa-IR", tr: "tr-TR",
  fr: "fr-FR", es: "es-ES", de: "de-DE", ru: "ru-RU", pt: "pt-PT",
  it: "it-IT", zh: "zh-CN", ja: "ja-JP", ko: "ko-KR", hi: "hi-IN",
  ur: "ur-PK", id: "id-ID", hu: "hu-HU",
};

export function dateLocale(lang: Lang): string {
  return DATE_LOCALES[lang] ?? "en-GB";
}

export function formatDate(iso: string | null | undefined, lang: Lang): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString(dateLocale(lang));
  } catch {
    return new Date(iso).toLocaleDateString("en-GB");
  }
}

export function formatDateTime(iso: string | null | undefined, lang: Lang): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString(dateLocale(lang));
  } catch {
    return new Date(iso).toLocaleString("en-GB");
  }
}
