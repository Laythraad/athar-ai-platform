"use client";

/* My Trip — device-local list with maps links and an AI-assisted plan. */

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { t, type Lang } from "@/lib/i18n";
import { loadTrip, saveTrip, tripText, type TripStop } from "@/lib/travel/trip";

export default function TripClient({ lang }: { lang: Lang }) {
  const [stops, setStops] = useState<TripStop[]>([]);
  const [ready, setReady] = useState(false);
  const [plan, setPlan] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    // localStorage hydration after mount (avoids SSR mismatch)
    const raf = requestAnimationFrame(() => {
      setStops(loadTrip());
      setReady(true);
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  const remove = useCallback((id: string) => {
    const next = loadTrip().filter((s) => s.id !== id);
    saveTrip(next);
    setStops(next);
  }, []);

  const clearAll = useCallback(() => {
    if (!confirm(t(lang, "trip_clear_confirm"))) return;
    saveTrip([]);
    setStops([]);
    setPlan(null);
  }, [lang]);

  async function askPlan() {
    if (stops.length === 0) return;
    setBusy(true);
    setErr(null);
    setPlan(null);
    try {
      const res = await fetch("/api/athar-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          q: `${t(lang, "trip_ask_prefix")}\n${tripText(stops)}`,
          lang,
          web: false,
        }),
      });
      const data = (await res.json()) as { ok?: boolean; answer?: string; errorKey?: string };
      if (data.ok && data.answer) setPlan(data.answer);
      else setErr(t(lang, "common_error"));
    } catch {
      setErr(t(lang, "common_error"));
    } finally {
      setBusy(false);
    }
  }

  if (!ready) return <p className="muted">{t(lang, "common_loading")}</p>;

  return (
    <div className="stack">
      {stops.length === 0 ? (
        <p className="muted">{t(lang, "trip_empty")}</p>
      ) : (
        <>
          <div className="stack" style={{ gap: "0.5rem" }}>
            {stops.map((s, i) => (
              <div key={s.id} className="card row-between" style={{ padding: "0.7rem" }}>
                <div>
                  <strong>
                    {i + 1}. {s.name}
                  </strong>
                  {s.gov ? <span className="tiny muted"> · {s.gov}</span> : null}
                </div>
                <div className="row">
                  {typeof s.lat === "number" && typeof s.lng === "number" && (
                    <a
                      className="btn btn-ghost btn-sm"
                      href={`https://www.google.com/maps?q=${s.lat},${s.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {t(lang, "near_open_maps")}
                    </a>
                  )}
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => remove(s.id)}>
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="row" style={{ flexWrap: "wrap" }}>
            <button type="button" className="btn btn-primary" disabled={busy} onClick={() => void askPlan()}>
              {busy ? t(lang, "ai_thinking") : t(lang, "trip_ask_plan")}
            </button>
            <button type="button" className="btn btn-ghost" onClick={clearAll}>
              {t(lang, "trip_clear")}
            </button>
            <Link href="/ai" className="btn btn-ghost btn-sm">
              {t(lang, "ai_title")}
            </Link>
          </div>
          {err && (
            <p className="field-err" role="alert">
              {err}
            </p>
          )}
          {plan && (
            <div className="card prose" style={{ whiteSpace: "pre-wrap" }}>
              {plan}
            </div>
          )}
        </>
      )}
      <p className="tiny muted" style={{ margin: 0 }}>
        {t(lang, "trip_local_note")}
      </p>
    </div>
  );
}
