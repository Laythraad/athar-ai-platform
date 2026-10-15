import { AIRPORTS, airportMapsUrl } from "@/lib/travel/airports";
import { t, bl } from "@/lib/i18n";
import { getCurrentLang } from "@/lib/lang";

export const instant = false;

export default async function AirportsPage() {
  const lang = await getCurrentLang();
  return (
    <div className="stack">
      <div>
        <h1 className="page-title">{t(lang, "air_title")}</h1>
        <p className="page-sub">{t(lang, "air_sub")}</p>
      </div>
      <p className="tiny muted" style={{ margin: 0 }}>
        {t(lang, "air_no_flights")}
      </p>
      <div className="grid-cards">
        {AIRPORTS.map((a) => (
          <div key={a.iata} className="card work-card stack" style={{ gap: "0.35rem" }}>
            <div className="row-between">
              <strong>{bl(lang, a.name)}</strong>
              <span className="pill">{a.iata}</span>
            </div>
            <span className="tiny muted">
              {bl(lang, a.city)} · {bl(lang, a.country)} · ICAO {a.icao}
            </span>
            {a.transportNote && <span className="tiny">{bl(lang, a.transportNote)}</span>}
            <div className="row">
              <a className="btn btn-primary btn-sm" href={airportMapsUrl(a)} target="_blank" rel="noopener noreferrer">
                {t(lang, "near_open_maps")}
              </a>
              {a.officialUrl && (
                <a className="btn btn-ghost btn-sm" href={a.officialUrl} target="_blank" rel="noopener noreferrer">
                  {t(lang, "air_official")}
                </a>
              )}
            </div>
            <span className="tiny muted">
              {t(lang, "her_source")}: {a.source} · {a.checked}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
