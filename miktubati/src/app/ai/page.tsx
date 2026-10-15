import AIChat from "@/components/AIChat";
import Link from "next/link";
import { t } from "@/lib/i18n";
import { getCurrentLang } from "@/lib/lang";
import { searchStatus } from "@/lib/ai/websearch";
import { isGeminiConfigured } from "@/lib/env";

export const instant = false;

export default async function AtharAiPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const lang = await getCurrentLang();
  const search = searchStatus();
  const sp = await searchParams;
  const initialQuery = typeof sp.q === "string" ? sp.q.slice(0, 300) : "";

  return (
    <div className="stack" style={{ maxWidth: "820px" }}>
      <div>
        <h1 className="page-title">{t(lang, "ai_title")}</h1>
        <p className="page-sub">{t(lang, "ai_sub")}</p>
      </div>

      <div className="row" style={{ flexWrap: "wrap" }}>
        <span className="pill">
          {t(lang, "ai_status_ai")}: {isGeminiConfigured() ? t(lang, "common_on") : t(lang, "common_off")}
        </span>
        <span className="pill">
          {t(lang, "ai_status_web")}: {search.configured ? search.provider : t(lang, "ai_web_off")}
        </span>
      </div>

      <AIChat lang={lang} initialQuery={initialQuery} />

      <div className="card stack" style={{ gap: "0.4rem" }}>
        <h2 style={{ fontSize: "1rem", margin: 0 }}>{t(lang, "ai_shortcuts")}</h2>
        <div className="row" style={{ flexWrap: "wrap" }}>
          <Link href="/heritage" className="btn btn-ghost btn-sm">
            {t(lang, "nav_heritage")}
          </Link>
          <Link href="/nearby" className="btn btn-ghost btn-sm">
            {t(lang, "nav_nearby")}
          </Link>
          <Link href="/travel" className="btn btn-ghost btn-sm">
            {t(lang, "nav_travel")}
          </Link>
          <Link href="/safety" className="btn btn-ghost btn-sm">
            {t(lang, "nav_safety")}
          </Link>
          <Link href="/my-library" className="btn btn-ghost btn-sm">
            {t(lang, "nav_mylib")}
          </Link>
        </div>
      </div>
    </div>
  );
}
