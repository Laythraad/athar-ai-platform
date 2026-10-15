"use client";

/* ATHAR AI unified chat — one conversation surface for the whole platform:
   destinations, history, books, culture, trips, live web questions. */

import { useCallback, useRef, useState } from "react";
import { t, type Lang } from "@/lib/i18n";

interface Citation {
  kind: "site" | "web";
  title: string;
  url: string | null;
}

interface Msg {
  role: "user" | "assistant";
  text: string;
  mode?: string;
  citations?: Citation[];
  webResults?: { title: string; url: string; snippet: string; publishedAt: string | null }[];
  guidance?: string | null;
}

const MODE_LABEL: Record<string, { en: string; ar: string }> = {
  safety: { en: "Safety guidance", ar: "إرشاد سلامة" },
  internal: { en: "ATHAR knowledge base", ar: "قاعدة معرفة أثَر" },
  web: { en: "Live web sources", ar: "مصادر ويب حية" },
  mixed: { en: "Knowledge base + web", ar: "قاعدة المعرفة + الويب" },
  search_failed: { en: "Web search failed", ar: "فشل البحث في الويب" },
  unavailable: { en: "Unavailable", ar: "غير متاح" },
};

export default function AIChat({ lang, initialQuery }: { lang: Lang; initialQuery?: string }) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState(initialQuery ?? "");
  const [busy, setBusy] = useState(false);
  const [web, setWeb] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const send = useCallback(
    async (text: string) => {
      const q = text.trim();
      if (!q || busy) return;
      setErr(null);
      setInput("");
      setMsgs((m) => [...m, { role: "user", text: q }]);
      setBusy(true);
      try {
        const res = await fetch("/api/athar-ai", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ q, lang, web }),
        });
        const data = (await res.json()) as {
          ok?: boolean;
          answer?: string;
          mode?: string;
          citations?: Citation[];
          webResults?: Msg["webResults"];
          guidance?: string | null;
          errorKey?: string;
        };
        if (!res.ok || !data.ok) {
          setErr(data?.errorKey === "rate_limited" ? t(lang, "ai_rate_limited") : t(lang, "common_error"));
        } else {
          setMsgs((m) => [
            ...m,
            {
              role: "assistant",
              text: data.answer ?? "",
              mode: data.mode,
              citations: data.citations,
              webResults: data.webResults,
              guidance: data.guidance,
            },
          ]);
        }
      } catch {
        setErr(t(lang, "common_error"));
      } finally {
        setBusy(false);
        queueMicrotask(() => listRef.current?.scrollTo({ top: listRef.current.scrollHeight }));
      }
    },
    [busy, lang, web],
  );

  return (
    <div className="card stack" style={{ gap: "0.7rem" }}>
      <div className="row-between">
        <strong>{t(lang, "ai_title")}</strong>
        <label className="row" style={{ gap: "0.35rem" }}>
          <span className="tiny">{t(lang, "ai_web_toggle")}</span>
          <input type="checkbox" checked={web} onChange={(e) => setWeb(e.target.checked)} />
        </label>
      </div>

      <div
        ref={listRef}
        className="stack"
        style={{ gap: "0.6rem", maxHeight: 420, overflowY: "auto", padding: "0.2rem" }}
        aria-live="polite"
      >
        {msgs.length === 0 && <p className="muted tiny" style={{ margin: 0 }}>{t(lang, "ai_greeting")}</p>}
        {msgs.map((m, i) => (
          <div
            key={i}
            className="card"
            style={{
              padding: "0.7rem",
              background: m.role === "user" ? "color-mix(in srgb, var(--accent) 8%, transparent)" : "var(--surface2)",
            }}
          >
            {m.role === "assistant" && m.mode && (
              <span className="pill tiny" style={{ marginBottom: "0.35rem", display: "inline-block" }}>
                {MODE_LABEL[m.mode]?.[lang === "ar" ? "ar" : "en"] ?? m.mode}
              </span>
            )}
            <div style={{ whiteSpace: "pre-wrap" }}>{m.text}</div>
            {m.role === "assistant" && m.webResults && m.webResults.length > 0 && (
              <ul className="tiny" style={{ margin: "0.5rem 0 0", paddingInlineStart: "1.1rem" }}>
                {m.webResults.map((r) => (
                  <li key={r.url}>
                    <a href={r.url} target="_blank" rel="noopener noreferrer">{r.title || r.url}</a>
                    {r.publishedAt ? <span className="muted"> · {r.publishedAt}</span> : null}
                  </li>
                ))}
              </ul>
            )}
            {m.role === "assistant" && m.citations && m.citations.length > 0 && m.citations.some((c) => c.kind === "site") && (
              <div className="row" style={{ flexWrap: "wrap", marginTop: "0.4rem" }}>
                {m.citations
                  .filter((c) => c.kind === "site")
                  .map((c, j) => (
                    <span key={j} className="pill tiny">{c.title}</span>
                  ))}
              </div>
            )}
          </div>
        ))}
        {busy && <p className="muted tiny" style={{ margin: 0 }}>{t(lang, "ai_thinking")}</p>}
      </div>

      <form
        className="row"
        onSubmit={(e) => {
          e.preventDefault();
          void send(input);
        }}
      >
        <input
          className="input"
          style={{ flex: "1 1 200px" }}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t(lang, "ai_input_ph")}
          aria-label={t(lang, "ai_title")}
        />
        <button className="btn btn-primary btn-sm" type="submit" disabled={busy}>
          {t(lang, "her_ask_send")}
        </button>
      </form>

      <div className="row" style={{ flexWrap: "wrap" }}>
        {(t(lang, "ai_shortcut_1") + "|" + t(lang, "ai_shortcut_2") + "|" + t(lang, "ai_shortcut_3"))
          .split("|")
          .map((s) => (
            <button
              key={s}
              type="button"
              className="pill tiny"
              style={{ cursor: "pointer" }}
              onClick={() => void send(s)}
            >
              {s}
            </button>
          ))}
      </div>

      {err && (
        <p className="field-err" style={{ margin: 0 }} role="alert">
          {err}
        </p>
      )}
      <p className="tiny muted" style={{ margin: 0 }}>
        {t(lang, "ai_disclaimer")}
      </p>
    </div>
  );
}
