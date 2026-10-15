import Link from "next/link";
import { notFound } from "next/navigation";
import { t, bl, herCatLabel, herPrecisionLabel } from "@/lib/i18n";
import { getCurrentLang } from "@/lib/lang";
import { IRAQ_SITES } from "@/lib/heritage/data";
import { cultureForGovernorate } from "@/lib/travel/culture";
import AddToTripButton from "@/components/AddToTripButton";

export const instant = false;

function haversine(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

export default async function HeritageDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const lang = await getCurrentLang();
  const { id } = await params;
  const site = IRAQ_SITES.find((s) => s.id === id || s.slug === id);
  if (!site) notFound();

  const related = IRAQ_SITES.filter((o) => o.id !== site.id)
    .map((o) => {
      let score = 0;
      if (o.governorate.en === site.governorate.en) score += 3;
      if (o.cat === site.cat) score += 2;
      if (o.country.iso === site.country.iso) score += 1;
      return { o, score, d: haversine(site.lat, site.lng, o.lat, o.lng) };
    })
    .filter((x) => x.score >= 2)
    .sort((a, b) => b.score - a.score || a.d - b.d)
    .slice(0, 5);

  const mapsUrl = `https://www.google.com/maps?q=${site.lat},${site.lng}`;
  const culture = cultureForGovernorate(site.governorate.en);
  const askAiUrl = `/ai?q=${encodeURIComponent(site.name.en + " " + site.name.ar)}`;

  return (
    <div className="stack" style={{ maxWidth: "900px" }}>
      <p style={{ margin: 0 }}>
        <Link href="/heritage" className="btn btn-ghost btn-sm">{t(lang, "her_back")}</Link>
      </p>

      <div className="row-between">
        <span className="pill">{herCatLabel(lang, site.cat)}</span>
        <span className="pill">{herPrecisionLabel(lang, site.precision)}</span>
      </div>

      <h1 className="page-title">{bl(lang, site.name)}</h1>
      <p className="muted" style={{ margin: 0 }}>
        {bl(lang, site.country)}
        {" · "}
        {bl(lang, site.governorate)}
        {site.city ? ` · ${bl(lang, site.city)}` : ""}
      </p>

      <div className="row">
        <span className="pill">{site.visit} {t(lang, "her_min")}</span>
        {site.era && <span className="pill">{bl(lang, site.era)}</span>}
      </div>

      <div className="card" style={{ textAlign: "center", color: "var(--fg2)" }}>
        <span className="tiny">{t(lang, "her_no_photo")}</span>
      </div>

      <div className="row" style={{ flexWrap: "wrap" }}>
        <a className="btn btn-primary btn-sm" href={mapsUrl} target="_blank" rel="noopener noreferrer">
          {t(lang, "her_open_maps")}
        </a>
        <AddToTripButton
          lang={lang}
          stop={{
            id: site.id,
            name: bl(lang, site.name),
            gov: bl(lang, site.governorate),
            lat: site.lat,
            lng: site.lng,
          }}
        />
        <Link href={askAiUrl} className="btn btn-ghost btn-sm">
          {t(lang, "her_ask_ai")}
        </Link>
      </div>

      <div className="detail-grid">
        <div className="prose">
          <h2>{t(lang, "her_summary")}</h2>
          <p>{bl(lang, site.summary)}</p>
          <h2>{t(lang, "her_significance")}</h2>
          <p>{bl(lang, site.significance)}</p>
          {site.facts?.length > 0 && (
            <>
              <h2>{t(lang, "her_facts")}</h2>
              <ul className="facts">
                {site.facts.map((f, i) => (
                  <li key={i}>{bl(lang, f)}</li>
                ))}
              </ul>
            </>
          )}
        </div>

        <div>
          {/* Cultural guide — "know before you go" (guidance, not law). */}
          {culture && (
            <div className="side-card">
              <h3>{t(lang, "culture_title")}</h3>
              <div className="kv">
                <span>{t(lang, "culture_dress")}</span>
                <span>{bl(lang, culture.dress)}</span>
              </div>
              <div className="kv">
                <span>{t(lang, "culture_photo")}</span>
                <span>{bl(lang, culture.photo)}</span>
              </div>
              <div className="kv">
                <span>{t(lang, "culture_greetings")}</span>
                <span>{bl(lang, culture.greetings)}</span>
              </div>
              <div className="kv">
                <span>{t(lang, "culture_markets")}</span>
                <span>{bl(lang, culture.markets)}</span>
              </div>
              <div className="kv">
                <span>{t(lang, "culture_law_note")}</span>
                <span>{bl(lang, culture.lawNote)}</span>
              </div>
            </div>
          )}

          {/* Tourism-facing quick plan: only facts we actually have — never
              invented fees or opening hours. */}
          <div className="side-card">
            <h3>{t(lang, "her_plan")}</h3>
            <div className="kv">
              <span>{t(lang, "her_visit_min")}</span>
              <span>{site.visit} {t(lang, "her_min")}</span>
            </div>
            <div className="kv">
              <span>{t(lang, "her_governorate")}</span>
              <span>{bl(lang, site.governorate)}</span>
            </div>
            {site.era && (
              <div className="kv">
                <span>{t(lang, "her_era")}</span>
                <span>{bl(lang, site.era)}</span>
              </div>
            )}
            {related.length > 0 && (
              <div className="kv">
                <span>{t(lang, "her_nearby")}</span>
                <span>{Math.round(related[0].d)} km · {bl(lang, related[0].o.name)}</span>
              </div>
            )}
            <div className="row" style={{ marginTop: "0.6rem" }}>
              <a className="btn btn-primary btn-sm" href={mapsUrl} target="_blank" rel="noopener noreferrer">
                {t(lang, "her_open_maps")}
              </a>
            </div>
          </div>

          <div className="side-card">
            <h3>{t(lang, "her_precision")}</h3>
            <div className="kv">
              <span>{t(lang, "her_coords")}</span>
              <span>{site.lat.toFixed(4)}, {site.lng.toFixed(4)}</span>
            </div>
            <div className="kv">
              <span>{t(lang, "her_visit_min")}</span>
              <span>{site.visit} {t(lang, "her_min")}</span>
            </div>
            {site.era && (
              <div className="kv"><span>{t(lang, "her_era")}</span><span>{bl(lang, site.era)}</span></div>
            )}
            <div className="kv"><span>{t(lang, "her_governorate")}</span><span>{bl(lang, site.governorate)}</span></div>
            <div className="kv"><span>{t(lang, "her_country")}</span><span>{bl(lang, site.country)}</span></div>
            {site.city && <div className="kv"><span>{t(lang, "her_city")}</span><span>{bl(lang, site.city)}</span></div>}
            {site.lastVerifiedAt && (
              <div className="kv"><span>{t(lang, "her_verified")}</span><span>{site.lastVerifiedAt}</span></div>
            )}
          </div>

          {site.source && (
            <div className="side-card">
              <h3>{t(lang, "her_source")}</h3>
              <p style={{ margin: 0 }}>
                <a href={site.source.url} target="_blank" rel="noopener noreferrer">{site.source.title}</a>
              </p>
              <p className="muted tiny" style={{ margin: "0.3rem 0 0" }}>
                {site.source.publisher} · {site.source.checked}
              </p>
            </div>
          )}

          {site.tags?.length > 0 && (
            <div className="side-card">
              <h3>{t(lang, "her_tags")}</h3>
              <div className="row">
                {site.tags.map((tag) => (
                  <span key={tag} className="pill">{tag}</span>
                ))}
              </div>
            </div>
          )}

          {related.length > 0 && (
            <div className="side-card">
              <h3>{t(lang, "her_related")}</h3>
              <div className="nearby-list">
                {related.map((n) => (
                  <Link key={n.o.id} href={`/heritage/${n.o.id}`}>
                    <span>{bl(lang, n.o.name)}</span>
                    <span className="muted">{Math.round(n.d)} km</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
