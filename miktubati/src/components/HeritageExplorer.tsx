import Link from "next/link";
import { t, bl, herCatLabel } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import { IRAQ_SITES } from "@/lib/heritage/data";
import HeritageAssistant from "@/components/HeritageAssistant";

type SP = { q?: string; cat?: string; gov?: string };

function card(site: (typeof IRAQ_SITES)[number], lang: Lang) {
  return (
    <article className="card work-card" key={site.id}>
      <div className="row-between">
        <span className="pill">{herCatLabel(lang, site.cat)}</span>
        <span className="pill">{bl(lang, site.governorate)}</span>
      </div>
      <h3 className="work-title">
        <Link href={`/heritage/${site.id}`} style={{ textDecoration: "none" }}>
          {bl(lang, site.name)}
        </Link>
      </h3>
      <p className="work-excerpt">{bl(lang, site.summary)}</p>
      <div className="work-meta">
        <span>
          {site.visit} {t(lang, "her_min")}
        </span>
        <span className="muted">{bl(lang, site.city)}</span>
      </div>
    </article>
  );
}

/** The heritage explorer — shared by the home page (ATHAR first) and /heritage. */
export default function HeritageExplorer({ lang, sp }: { lang: Lang; sp: SP }) {
  const q = (sp.q ?? "").trim().toLowerCase();
  const cat = sp.cat ?? "all";
  const gov = sp.gov ?? "all";

  const govs = Array.from(new Set(IRAQ_SITES.map((s) => s.governorate.en))).sort();
  const cats = Array.from(new Set(IRAQ_SITES.map((s) => s.cat))).sort();

  const list = IRAQ_SITES.filter((s) => {
    if (cat !== "all" && s.cat !== cat) return false;
    if (gov !== "all" && s.governorate.en !== gov) return false;
    if (!q) return true;
    const hay = [
      s.name.en, s.name.ar, s.governorate.en, s.governorate.ar,
      s.city.en, s.city.ar, s.summary.en, s.summary.ar, ...(s.tags ?? []),
    ].join(" ").toLowerCase();
    return hay.includes(q);
  });

  return (
    <div className="stack">
      <div className="row-between">
        <div>
          <h2 className="page-title" style={{ fontSize: "1.6rem" }}>
            {t(lang, "her_title")}
          </h2>
          <p className="page-sub">{t(lang, "her_sub")}</p>
        </div>
        <Link href="/heritage/map" className="btn btn-ghost btn-sm">
          {t(lang, "her_map_title")}
        </Link>
      </div>

      <HeritageAssistant lang={lang} />

      <form className="card stack" method="get" action="/heritage">
        <div className="row">
          <label className="field" style={{ flex: "1 1 220px" }}>
            {t(lang, "lib_search")}
            <input
              className="input"
              type="search"
              name="q"
              defaultValue={q}
              placeholder={t(lang, "her_search_ph")}
            />
          </label>

          <label className="field" style={{ flex: "0 1 180px" }}>
            {t(lang, "her_cat")}
            <select className="select" name="cat" defaultValue={cat}>
              <option value="all">{t(lang, "her_cat_all")}</option>
              {cats.map((c) => (
                <option key={c} value={c}>
                  {herCatLabel(lang, c)}
                </option>
              ))}
            </select>
          </label>

          <label className="field" style={{ flex: "0 1 180px" }}>
            {t(lang, "her_gov")}
            <select className="select" name="gov" defaultValue={gov}>
              <option value="all">{t(lang, "her_gov_all")}</option>
              {govs.map((g) => (
                <option key={g} value={g}>
                  {lang === "ar"
                    ? bl(lang, IRAQ_SITES.find((s) => s.governorate.en === g)!.governorate)
                    : g}
                </option>
              ))}
            </select>
          </label>

          <div style={{ alignSelf: "end" }}>
            <button className="btn btn-primary" type="submit">
              {t(lang, "lib_apply")}
            </button>
          </div>
        </div>
      </form>

      <p className="tiny muted" style={{ margin: 0 }}>
        {t(lang, "her_results", { n: list.length })}
      </p>

      {list.length === 0 ? (
        <div className="card">
          <p style={{ margin: 0 }}>{t(lang, "her_empty")}</p>
          <p className="muted tiny" style={{ margin: "0.3rem 0 0" }}>
            {t(lang, "her_empty_sub")}
          </p>
        </div>
      ) : (
        <div className="grid-cards">
          {list.map((s) => card(s, lang))}
        </div>
      )}
    </div>
  );
}
