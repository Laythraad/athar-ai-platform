import { getSession } from "@/lib/session";
import { t, formatCount } from "@/lib/i18n";
import { getCurrentLang } from "@/lib/lang";
import { fetchPublishedWorks, fetchCategories } from "@/lib/queries";
import { isDbConfigured } from "@/lib/env";
import WorkCard from "@/components/WorkCard";
import Link from "next/link";

export const instant = false;

type SP = { q?: string; cat?: string; sort?: string };

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const lang = await getCurrentLang();
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const cat = typeof sp.cat === "string" ? sp.cat : "all";
  const sort = sp.sort === "top" || sp.sort === "read" ? sp.sort : "new";

  const dbReady = isDbConfigured();
  const s = await getSession();
  const categories = dbReady ? await fetchCategories() : [];
  const works = dbReady ? await fetchPublishedWorks({ q, category: cat, sort }) : [];

  return (
    <div className="stack">
      <div>
        <h1 className="page-title">{t(lang, "lib_title")}</h1>
        <p className="page-sub">{t(lang, "lib_sub")}</p>
      </div>

      <form className="card stack" method="get" action="/library">
        <div className="row">
          <label className="field" style={{ flex: "1 1 220px" }}>
            {t(lang, "lib_search")}
            <input
              className="input"
              type="search"
              name="q"
              defaultValue={q}
              placeholder={t(lang, "lib_search_ph")}
            />
          </label>

          <label className="field" style={{ flex: "0 1 200px" }}>
            {t(lang, "lib_category")}
            <select className="select" name="cat" defaultValue={cat}>
              <option value="all">{t(lang, "lib_all")}</option>
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {lang === "ar" ? c.name_ar : c.name_en}
                </option>
              ))}
            </select>
          </label>

          <label className="field" style={{ flex: "0 1 160px" }}>
            {t(lang, "lib_sort")}
            <select className="select" name="sort" defaultValue={sort}>
              <option value="new">{t(lang, "lib_sort_new")}</option>
              <option value="top">{t(lang, "lib_sort_top")}</option>
              <option value="read">{t(lang, "lib_sort_read")}</option>
            </select>
          </label>

          <div style={{ alignSelf: "end" }}>
            <button className="btn btn-primary" type="submit">
              {t(lang, "lib_apply")}
            </button>
          </div>
        </div>
      </form>

      {!dbReady ? (
        <div className="status-note">{t(lang, "common_offline_db")}</div>
      ) : (
        <>
          <p className="tiny muted" style={{ margin: 0 }}>
            {formatCount(lang, works.length, "work")}
          </p>

          {works.length === 0 ? (
            <div className="card">
              <p style={{ margin: 0 }}>{t(lang, "lib_empty")}</p>
              <p className="muted tiny" style={{ margin: "0.3rem 0 0" }}>
                {t(lang, "lib_empty_sub")}
              </p>
              {s.stage === "member" && !s.isBlocked && (
                <p style={{ margin: "0.6rem 0 0" }}>
                  <Link href="/publish" className="btn btn-primary btn-sm">
                    {t(lang, "home_cta_publish")}
                  </Link>
                </p>
              )}
            </div>
          ) : (
            <div className="grid-cards">
              {works.map((w) => (
                <WorkCard key={w.id} work={w} lang={lang} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}