import Link from "next/link";
import { getSession } from "@/lib/session";
import { t } from "@/lib/i18n";
import { getCurrentLang } from "@/lib/lang";
import { fetchPublishedWorks } from "@/lib/queries";
import { IRAQ_SITES } from "@/lib/heritage/data";
import HeritageExplorer from "@/components/HeritageExplorer";
import WorkCard from "@/components/WorkCard";

export const instant = false;

/** Home = أثر first: heritage + library doors, quick actions, featured works. */
export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; cat?: string; gov?: string }>;
}) {
  const lang = await getCurrentLang();
  const s = await getSession();
  const sp = await searchParams;
  const name = s.profile?.pen_name;

  const works = await fetchPublishedWorks({ sort: "new", limit: 6 });
  const signedIn = Boolean(s.userId);

  return (
    <div className="stack" style={{ gap: "1.6rem" }}>
      <section className="gate-hero athar-hero">
        <p className="pill">{t(lang, "brand_sub")}</p>
        <h1
          className="page-title"
          style={{ fontSize: "clamp(2.2rem, 6vw, 3.6rem)", margin: "0.3rem 0" }}
        >
          {t(lang, "brand")}
        </h1>
        <p className="gate-tag">{t(lang, "gate_tagline")}</p>
        <p className="page-sub" style={{ marginInline: "auto" }}>
          {t(lang, "tagline")}
        </p>

        <p className="home-stats" aria-label={t(lang, "home_stat_sites")}>
          <span>
            <strong>{IRAQ_SITES.length}</strong> {t(lang, "home_stat_sites")}
          </span>
          <span aria-hidden="true">·</span>
          <span>
            <strong>+</strong> {t(lang, "home_stat_works")}
          </span>
        </p>

        {name && (
          <p className="muted" style={{ margin: 0 }}>
            {t(lang, "gate_member")}{" "}
            <strong style={{ color: "var(--accent)" }}>{name}</strong>
          </p>
        )}

        <p className="row" style={{ justifyContent: "center", gap: "0.6rem", flexWrap: "wrap" }}>
          <Link href="/heritage" className="btn btn-primary">
            {t(lang, "home_discover")}
          </Link>
          <Link href="/library" className="btn btn-ghost">
            {t(lang, "home_enter")}
          </Link>
          {!signedIn && (
            <Link href="/signin" className="btn btn-ghost">
              {t(lang, "nav_signin")}
            </Link>
          )}
        </p>
      </section>

      <section className="quick-grid" aria-label={t(lang, "home_quick_title")}>
        <h2 className="section-title">{t(lang, "home_quick_title")}</h2>
        <div className="qg-cards">
          <Link href="/heritage" className="qg-card">
            <span className="qg-icon" aria-hidden="true">🗿</span>
            <span className="qg-title">{t(lang, "home_q1")}</span>
            <span className="qg-sub">{t(lang, "home_q1_sub")}</span>
          </Link>
          <Link href="/library" className="qg-card">
            <span className="qg-icon" aria-hidden="true">📚</span>
            <span className="qg-title">{t(lang, "home_q2")}</span>
            <span className="qg-sub">{t(lang, "home_q2_sub")}</span>
          </Link>
          <Link href="/ai" className="qg-card">
            <span className="qg-icon" aria-hidden="true">🤖</span>
            <span className="qg-title">{t(lang, "nav_ai")}</span>
            <span className="qg-sub">{t(lang, "ai_sub")}</span>
          </Link>
          <Link href="/my-library" className="qg-card">
            <span className="qg-icon" aria-hidden="true">🔒</span>
            <span className="qg-title">{t(lang, "nav_mylib")}</span>
            <span className="qg-sub">{t(lang, "lib_sub")}</span>
          </Link>
          <Link href="/nearby" className="qg-card">
            <span className="qg-icon" aria-hidden="true">📍</span>
            <span className="qg-title">{t(lang, "nav_nearby")}</span>
            <span className="qg-sub">{t(lang, "near_sub")}</span>
          </Link>
          <Link href="/travel" className="qg-card">
            <span className="qg-icon" aria-hidden="true">🧳</span>
            <span className="qg-title">{t(lang, "nav_travel")}</span>
            <span className="qg-sub">{t(lang, "travel_sub")}</span>
          </Link>
          <Link href="/safety" className="qg-card">
            <span className="qg-icon" aria-hidden="true">🆘</span>
            <span className="qg-title">{t(lang, "nav_safety")}</span>
            <span className="qg-sub">{t(lang, "safety_sub")}</span>
          </Link>
          <Link href="/studio" className="qg-card">
            <span className="qg-icon" aria-hidden="true">🎨</span>
            <span className="qg-title">{t(lang, "nav_studio")}</span>
            <span className="qg-sub">{t(lang, "studio_sub")}</span>
          </Link>
          <Link href="/kids" className="qg-card">
            <span className="qg-icon" aria-hidden="true">🧒</span>
            <span className="qg-title">{t(lang, "nav_kids")}</span>
            <span className="qg-sub">{t(lang, "kids_sub")}</span>
          </Link>
          <Link href="/passport" className="qg-card">
            <span className="qg-icon" aria-hidden="true">🛂</span>
            <span className="qg-title">{t(lang, "nav_passport")}</span>
            <span className="qg-sub">{t(lang, "passport_sub")}</span>
          </Link>
        </div>
      </section>

      <HeritageExplorer lang={lang} sp={sp} />

      {works.length > 0 && (
        <section className="stack">
          <div className="row-between">
            <h2 className="section-title" style={{ margin: 0 }}>
              {t(lang, "home_featured")}
            </h2>
            <Link href="/library" className="btn btn-ghost btn-sm">
              {t(lang, "home_view_all")}
            </Link>
          </div>
          <div className="grid-cards">
            {works.map((w) => (
              <WorkCard key={w.id} work={w} lang={lang} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
