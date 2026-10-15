import { allEmergencies } from "@/lib/ai/safety";
import { t, bl } from "@/lib/i18n";
import { getCurrentLang } from "@/lib/lang";
import Link from "next/link";

export const instant = false;

export default async function SafetyPage() {
  const lang = await getCurrentLang();
  const entries = allEmergencies();

  return (
    <div className="stack">
      <div>
        <h1 className="page-title">{t(lang, "safety_title")}</h1>
        <p className="page-sub">{t(lang, "safety_sub")}</p>
      </div>

      <div className="card stack" style={{ gap: "0.4rem", borderColor: "var(--rust)" }}>
        <strong>{t(lang, "safety_iraq_911")}</strong>
        <p style={{ margin: 0 }}>{t(lang, "safety_iraq_note")}</p>
        <p className="tiny muted" style={{ margin: 0 }}>
          {t(lang, "safety_no_dispatch")}
        </p>
      </div>

      <h2 style={{ fontSize: "1.1rem", margin: 0 }}>{t(lang, "safety_numbers")}</h2>
      <div className="grid-cards">
        {entries.map((e) => (
          <div key={e.country.iso} className="card work-card stack" style={{ gap: "0.35rem" }}>
            <strong>{bl(lang, e.country)}</strong>
            <div className="kv">
              <span>{t(lang, "safety_unified")}</span>
              <span>{e.unified ?? "—"}</span>
            </div>
            {e.police && (
              <div className="kv">
                <span>{t(lang, "safety_police")}</span>
                <span>{e.police}</span>
              </div>
            )}
            {e.ambulance && (
              <div className="kv">
                <span>{t(lang, "safety_ambulance")}</span>
                <span>{e.ambulance}</span>
              </div>
            )}
            {e.fire && (
              <div className="kv">
                <span>{t(lang, "safety_fire")}</span>
                <span>{e.fire}</span>
              </div>
            )}
            <p className="tiny muted" style={{ margin: 0 }}>
              {lang === "ar" ? e.note.ar : e.note.en}
            </p>
            <p className="tiny muted" style={{ margin: 0 }}>
              {e.source}
              {e.sourceUrl ? (
                <>
                  {" · "}
                  <a href={e.sourceUrl} target="_blank" rel="noopener noreferrer">
                    {t(lang, "safety_gov_source")}
                  </a>
                </>
              ) : null}
              {" · "}
              {t(lang, "safety_checked")}: {e.checked}
            </p>
          </div>
        ))}
      </div>

      <div className="card stack" style={{ gap: "0.4rem" }}>
        <strong>{t(lang, "safety_tips_title")}</strong>
        <ul className="facts">
          <li>{t(lang, "safety_tip_docs")}</li>
          <li>{t(lang, "safety_tip_copy")}</li>
          <li>{t(lang, "safety_tip_embassy")}</li>
          <li>{t(lang, "safety_tip_location")}</li>
        </ul>
        <Link href="/ai" className="btn btn-ghost btn-sm" style={{ alignSelf: "flex-start" }}>
          {t(lang, "safety_ask_ai")}
        </Link>
      </div>
    </div>
  );
}
