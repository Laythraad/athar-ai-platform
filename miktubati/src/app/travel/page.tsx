import Link from "next/link";
import { t } from "@/lib/i18n";
import { getCurrentLang } from "@/lib/lang";

export const instant = false;

export default async function TravelPage() {
  const lang = await getCurrentLang();
  return (
    <div className="stack">
      <div>
        <h1 className="page-title">{t(lang, "travel_title")}</h1>
        <p className="page-sub">{t(lang, "travel_sub")}</p>
      </div>
      <div className="grid-cards">
        <Link href="/travel/airports" className="card work-card stack" style={{ gap: "0.4rem" }}>
          <strong>✈️ {t(lang, "travel_airports")}</strong>
          <span className="tiny muted">{t(lang, "travel_airports_sub")}</span>
        </Link>
        <Link href="/travel/trip" className="card work-card stack" style={{ gap: "0.4rem" }}>
          <strong>🧳 {t(lang, "travel_mytrip")}</strong>
          <span className="tiny muted">{t(lang, "travel_mytrip_sub")}</span>
        </Link>
        <Link href="/heritage" className="card work-card stack" style={{ gap: "0.4rem" }}>
          <strong>🗿 {t(lang, "travel_destinations")}</strong>
          <span className="tiny muted">{t(lang, "travel_destinations_sub")}</span>
        </Link>
        <Link href="/nearby" className="card work-card stack" style={{ gap: "0.4rem" }}>
          <strong>📍 {t(lang, "nav_nearby")}</strong>
          <span className="tiny muted">{t(lang, "near_sub")}</span>
        </Link>
        <Link href="/safety" className="card work-card stack" style={{ gap: "0.4rem" }}>
          <strong>🆘 {t(lang, "safety_title")}</strong>
          <span className="tiny muted">{t(lang, "safety_sub")}</span>
        </Link>
        <Link href="/ai" className="card work-card stack" style={{ gap: "0.4rem" }}>
          <strong>🤖 {t(lang, "ai_title")}</strong>
          <span className="tiny muted">{t(lang, "ai_sub")}</span>
        </Link>
      </div>
      <p className="tiny muted" style={{ margin: 0 }}>
        {t(lang, "travel_no_booking")}
      </p>
    </div>
  );
}
