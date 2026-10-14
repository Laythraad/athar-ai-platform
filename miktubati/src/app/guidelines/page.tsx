import { getSession } from "@/lib/session";
import { t } from "@/lib/i18n";
import { getCurrentLang } from "@/lib/lang";
import { adminSupabase } from "@/lib/supabase/admin";
import { isDbConfigured } from "@/lib/env";
import GuidelinesBody from "@/components/GuidelinesBody";

export const instant = false;

interface VersionRow {
  version: number;
  content_ar: string;
  content_en: string;
  created_at: string;
}

export default async function GuidelinesPage() {
  const lang = await getCurrentLang();

  if (!isDbConfigured()) {
    return (
      <div className="panel-wide">
        <h1 className="page-title">{t(lang, "guidelines_title")}</h1>
        <div className="status-note">{t(lang, "common_offline_db")}</div>
        <GuidelinesBody lang={lang} />
      </div>
    );
  }

  const session = await getSession();
  const admin = adminSupabase();

  let latest: VersionRow | null = null;
  if (admin) {
    const { data } = await admin
      .from("guideline_versions")
      .select("version, content_ar, content_en, created_at")
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();
    latest = (data as VersionRow | null) ?? null;
  }

  const version = latest?.version ?? session.latestVersion;
  const body = lang === "en" ? (latest?.content_en ?? null) : (latest?.content_ar ?? null);

  return (
    <div className="panel-wide">
      <h1 className="page-title">{t(lang, "guidelines_title")}</h1>
      <p className="tiny muted">{t(lang, "guidelines_version", { v: version })}</p>

      {body ? (
        <GuidelinesBody lang={lang} html={body} />
      ) : (
        <GuidelinesBody lang={lang} />
      )}
    </div>
  );
}