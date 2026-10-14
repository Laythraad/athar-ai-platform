"use client";

import { useState } from "react";

/**
 * Interactive 1–5 star rating.
 * Calls POST /api/ratings. Never allows the client to assert a value the
 * server did not already validate (stars is re-checked server-side).
 */
export default function Stars({
  authorId,
  mine,
  canRate,
  labels,
}: {
  authorId: string;
  mine: number | null;
  canRate: boolean;
  labels: { rate: string; own: string; saved: string; error: string };
}) {
  const [value, setValue] = useState<number>(mine ?? 0);
  const [hover, setHover] = useState<number>(0);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function submit(stars: number) {
    if (!canRate || busy) return;
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/ratings", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ authorId, stars }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; avg?: number; count?: number };
      if (res.ok && data.ok) {
        setValue(stars);
        setMsg(`${labels.saved}${typeof data.avg === "number" ? ` — ★ ${data.avg.toFixed(1)} (${data.count})` : ""}`);
      } else {
        setMsg(labels.error);
      }
    } catch {
      setMsg(labels.error);
    } finally {
      setBusy(false);
    }
  }

  if (!canRate) {
    return (
      <p className="muted tiny" style={{ margin: 0 }}>
        {labels.own}
      </p>
    );
  }

  const shown = hover || value;

  return (
    <div className="stack" style={{ gap: "0.35rem" }}>
      <div className="stars" role="group" aria-label={labels.rate}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            data-on={n <= shown ? "1" : "0"}
            aria-label={`${n}`}
            disabled={busy}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            onClick={() => submit(n)}
          >
            ★
          </button>
        ))}
      </div>
      {msg && (
        <p className="tiny muted" style={{ margin: 0 }} role="status">
          {msg}
        </p>
      )}
    </div>
  );
}
