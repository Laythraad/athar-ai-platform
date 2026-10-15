"use client";

/* Cultural Passport — visited-sites log (server-backed; falls back to
   localStorage for anonymous browsing with an honest label). */

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { t, bl, type Lang } from "@/lib/i18n";
import { IRAQ_SITES } from "@/lib/heritage/data";

const LS_KEY = "athar_passport_v1";

export default function PassportClient({ lang, signedIn }: { lang: Lang; signedIn: boolean }) {
  const [visited, setVisited] = useState<Set<string>>(new Set());
  const [ready, setReady] = useState(false);

  const load = useCallback(async () => {
    if (signedIn) {
      try {
        const res = await fetch("/api/passport");
        if (res.ok) {
          const data = (await res.json()) as { ok?: boolean; visits?: { site_id: string }[] };
          if (data.ok && data.visits) {
            setVisited(new Set(data.visits.map((v) => v.site_id)));
            setReady(true);
            return;
          }
        }
      } catch {
        // fall through to localStorage
      }
    }
    try {
      const raw = window.localStorage.getItem(LS_KEY);
      setVisited(new Set(raw ? (JSON.parse(raw) as string[]) : []));
    } catch {
      setVisited(new Set());
    }
    setReady(true);
  }, [signedIn]);

  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      void load();
    });
    return () => cancelAnimationFrame(raf);
  }, [load]);

  async function toggle(siteId: string) {
    const next = new Set(visited);
    const adding = !next.has(siteId);
    if (adding) next.add(siteId);
    else next.delete(siteId);
    setVisited(next);

    if (signedIn) {
      await fetch("/api/passport", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ siteId, visited: adding }),
      });
    } else {
      try {
        window.localStorage.setItem(LS_KEY, JSON.stringify([...next]));
      } catch {
        // ignore
      }
    }
  }

  const badge = (() => {
    const n = visited.size;
    if (n >= 15) return t(lang, "passport_badge_15");
    if (n >= 10) return t(lang, "passport_badge_10");
    if (n >= 5) return t(lang, "passport_badge_5");
    if (n >= 1) return t(lang, "passport_badge_1");
    return null;
  })();

  if (!ready) return <p className="muted">{t(lang, "common_loading")}</p>;

  return (
    <div className="stack">
      <div className="card row-between" style={{ padding: "0.9rem" }}>
        <strong>
          {t(lang, "passport_count")}: {visited.size} / {IRAQ_SITES.length}
        </strong>
        {badge && <span className="pill">{badge}</span>}
      </div>
      {!signedIn && (
        <p className="tiny muted" style={{ margin: 0 }}>
          {t(lang, "passport_local_note")}
        </p>
      )}
      <div className="grid-cards">
        {IRAQ_SITES.map((s) => {
          const isVisited = visited.has(s.id);
          return (
            <div key={s.id} className="card work-card stack" style={{ gap: "0.35rem" }}>
              <div className="row-between">
                <strong>{bl(lang, s.name)}</strong>
                <span className="pill tiny">{bl(lang, s.governorate)}</span>
              </div>
              <div className="row">
                <Link href={`/heritage/${s.id}`} className="btn btn-ghost btn-sm">
                  {t(lang, "lib_open")}
                </Link>
                <button
                  type="button"
                  className={`btn btn-sm ${isVisited ? "btn-primary" : "btn-ghost"}`}
                  onClick={() => void toggle(s.id)}
                >
                  {isVisited ? `✓ ${t(lang, "passport_visited")}` : t(lang, "passport_mark")}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
