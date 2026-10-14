import Link from "next/link";
import { t, bl } from "@/lib/i18n";
import { getCurrentLang } from "@/lib/lang";
import { fetchPublishedWorks } from "@/lib/queries";
import { retrieveHeritage } from "@/lib/heritage/ask";
import WorkCard from "@/components/WorkCard";

export const instant = false;

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const lang = await getCurrentLang();
  const { q } = await searchParams;
  const query = (q ?? "").trim();

  const [works, sites] = query
    ? await Promise.all([
        fetchPublishedWorks({ q: query, limit: 40 }),
        Promise.resolve(retrieveHeritage(query, 12)),
      ])
    : [[], []];

  const total = works.length + sites.length;

  return (
    <div className="stack">
      <div>
        <h1 className="page-title">{t(lang, "search_title")}</h1>
        <p className="page-sub">{t(lang, "search_sub")}</p>
      </div>

      <form className="card row" method="get" action="/search">
        <input
          className="input"
          style={{ flex: "1 1 240px" }}
          type="search"
          name="q"
          defaultValue={query}
          placeholder={t(lang, "search_ph")}
          aria-label={t(lang, "search_title")}
          autoFocus
        />
        <button className="btn btn-primary" type="submit">{t(lang, "search_go")}</button>
      </form>

      {query && (
        <p className="tiny muted" style={{ margin: 0 }}>
          {t(lang, "search_results", { n: total })}
        </p>
      )}

      {!query ? (
        <div className="card">
          <p className="muted" style={{ margin: 0 }}>{t(lang, "search_hint")}</p>
        </div>
      ) : total === 0 ? (
        <div className="card">
          <p style={{ margin: 0 }}>{t(lang, "search_empty")}</p>
        </div>
      ) : (
        <>
          {sites.length > 0 && (
            <section>
              <h2 className="page-title" style={{ fontSize: "1.3rem" }}>{t(lang, "her_title")}</h2>
              <div className="grid-cards">
                {sites.map((s) => (
                  <article className="card work-card" key={s.id}>
                    <div className="row-between">
                      <span className="pill">{bl(lang, s.governorate)}</span>
                      <span className="pill">{s.visit} {t(lang, "her_min")}</span>
                    </div>
                    <h3 className="work-title">
                      <Link href={`/heritage/${s.id}`} style={{ textDecoration: "none" }}>
                        {bl(lang, s.name)}
                      </Link>
                    </h3>
                    <p className="work-excerpt">{bl(lang, s.summary)}</p>
                  </article>
                ))}
              </div>
            </section>
          )}

          {works.length > 0 && (
            <section>
              <h2 className="page-title" style={{ fontSize: "1.3rem" }}>{t(lang, "lib_title")}</h2>
              <div className="grid-cards">
                {works.map((w) => (
                  <WorkCard key={w.id} work={w} lang={lang} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
