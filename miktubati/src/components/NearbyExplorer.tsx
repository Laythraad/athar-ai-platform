"use client";

/* Nearby places — explicit-permission geolocation + manual-city fallback.
   Coordinates stay on the device: distance is computed client-side against
   the sourced heritage dataset; nothing is uploaded. */

import { useMemo, useState } from "react";
import Link from "next/link";
import { t, bl, type Lang } from "@/lib/i18n";

export interface NearSite {
  id: string;
  name: { en: string; ar: string };
  governorate: { en: string; ar: string };
  lat: number;
  lng: number;
  cat: string;
  visit: number;
}

const CITY_COORDS: Record<string, { lat: number; lng: number; en: string }> = {
  baghdad: { lat: 33.3152, lng: 44.3661, en: "Baghdad" },
  بغداد: { lat: 33.3152, lng: 44.3661, en: "Baghdad" },
  basra: { lat: 30.5085, lng: 47.7804, en: "Basra" },
  البصرة: { lat: 30.5085, lng: 47.7804, en: "Basra" },
  mosul: { lat: 36.34, lng: 43.13, en: "Mosul" },
  الموصل: { lat: 36.34, lng: 43.13, en: "Mosul" },
  erbil: { lat: 36.19, lng: 44.01, en: "Erbil" },
  أربيل: { lat: 36.19, lng: 44.01, en: "Erbil" },
  najaf: { lat: 32.0, lng: 44.33, en: "Najaf" },
  النجف: { lat: 32.0, lng: 44.33, en: "Najaf" },
  karbala: { lat: 32.616, lng: 44.024, en: "Karbala" },
  كربلاء: { lat: 32.616, lng: 44.024, en: "Karbala" },
  hillah: { lat: 32.467, lng: 44.428, en: "Hillah" },
  الحلة: { lat: 32.467, lng: 44.428, en: "Hillah" },
  samarra: { lat: 34.198, lng: 43.874, en: "Samarra" },
  سامرّاء: { lat: 34.198, lng: 43.874, en: "Samarra" },
  nassiriya: { lat: 31.043, lng: 46.257, en: "Nassiriya" },
  الناصرية: { lat: 31.043, lng: 46.257, en: "Nassiriya" },
};

function haversine(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

export default function NearbyExplorer({ lang, sites }: { lang: Lang; sites: NearSite[] }) {
  const [origin, setOrigin] = useState<{ lat: number; lng: number; label: string } | null>(null);
  const [status, setStatus] = useState<"idle" | "denied" | "unavailable">("idle");
  const [city, setCity] = useState("");
  const [showExplain, setShowExplain] = useState(false);

  const results = useMemo(() => {
    if (!origin) return [];
    return sites
      .map((s) => ({ ...s, dist: haversine(origin.lat, origin.lng, s.lat, s.lng) }))
      .sort((a, b) => a.dist - b.dist)
      .slice(0, 12);
  }, [origin, sites]);

  function requestGps() {
    if (!("geolocation" in navigator)) {
      setStatus("unavailable");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setOrigin({ lat: pos.coords.latitude, lng: pos.coords.longitude, label: "" });
        setStatus("idle");
      },
      () => setStatus("denied"),
      { timeout: 10_000, maximumAge: 300_000 },
    );
  }

  function applyCity() {
    const key = city.trim().toLowerCase();
    const hit = CITY_COORDS[key] || CITY_COORDS[city.trim()];
    if (hit) {
      setOrigin({ lat: hit.lat, lng: hit.lng, label: hit.en });
      setStatus("idle");
    } else {
      setOrigin(null);
      setStatus("idle");
    }
  }

  return (
    <div className="stack">
      <div className="card stack" style={{ gap: "0.5rem" }}>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            setShowExplain(true);
            requestGps();
          }}
        >
          {t(lang, "near_use_gps")}
        </button>
        {showExplain && (
          <p className="tiny muted" style={{ margin: 0 }}>
            {t(lang, "near_gps_explain")}
          </p>
        )}
        {(status === "denied" || status === "unavailable") && (
          <p className="field-err" style={{ margin: 0 }}>
            {t(lang, "near_permission_denied")}
          </p>
        )}
        <form
          className="row"
          onSubmit={(e) => {
            e.preventDefault();
            applyCity();
          }}
        >
          <input
            className="input"
            style={{ flex: "1 1 180px" }}
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder={t(lang, "near_manual_ph")}
            aria-label={t(lang, "near_manual")}
          />
          <button className="btn btn-ghost" type="submit">
            {t(lang, "near_manual")}
          </button>
        </form>
      </div>

      {origin && (
        <p className="tiny muted" style={{ margin: 0 }}>
          {t(lang, "near_sort_dist")} {origin.label ? `· ${origin.label}` : ""} · {t(lang, "near_city_hint")}
        </p>
      )}

      <div className="grid-cards">
        {results.map((s) => (
          <div key={s.id} className="card work-card stack" style={{ gap: "0.35rem" }}>
            <div className="row-between">
              <strong>{bl(lang, s.name)}</strong>
              <span className="pill">
                {Math.round(s.dist)} km {t(lang, "near_dist")}
              </span>
            </div>
            <span className="tiny muted">{bl(lang, s.governorate)}</span>
            <div className="row">
              <Link href={`/heritage/${s.id}`} className="btn btn-primary btn-sm">
                {t(lang, "lib_open")}
              </Link>
              <a
                className="btn btn-ghost btn-sm"
                href={`https://www.google.com/maps?q=${s.lat},${s.lng}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {t(lang, "near_open_maps")}
              </a>
            </div>
          </div>
        ))}
      </div>

      {origin && results.length === 0 && <p className="muted">{t(lang, "near_no_results")}</p>}

      <p className="tiny muted" style={{ margin: 0 }}>
        {t(lang, "near_demo_notice")}
      </p>
    </div>
  );
}
