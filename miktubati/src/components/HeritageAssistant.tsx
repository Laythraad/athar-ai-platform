"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { t, type Lang } from "@/lib/i18n";

interface Match {
  id: string;
  name: string;
  governorate: string;
  summary: string;
}

interface Msg {
  role: "user" | "assistant";
  text: string;
  matches?: Match[];
  source?: "ai" | "retrieval";
}

const SUGGESTIONS: Record<string, string[]> = {
  ar: ["بابل", "أين تقع أور؟", "أشهر معالم البصرة", "قصة باب عشتار"],
  en: ["Babylon", "Where is Ur?", "Basra landmarks", "Ishtar Gate story"],
};
const FALLBACK_SUGGESTIONS = ["Babylon", "Where is Ur?"];

export default function HeritageAssistant({ lang }: { lang: Lang }) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const logRef = useRef<HTMLDivElement>(null);

  const suggestions = SUGGESTIONS[lang] ?? (lang === "ar" ? SUGGESTIONS.ar : FALLBACK_SUGGESTIONS);

  /* keep the newest bubble in view — long answers used to append below the fold */
  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, busy]);

  async function ask(raw: string) {
    const q = raw.trim();
    if (!q || busy) return;
    setInput("");
    setError(null);
    setBusy(true);
    setMessages((m) => [...m, { role: "user", text: q }]);
    try {
      const res = await fetch("/api/heritage-ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ q, lang }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data?.errorKey || "request_failed");
      }
      setMessages((m) => [
        ...m,
        { role: "assistant", text: data.answer, matches: data.matches, source: data.source },
      ]);
    } catch {
      setError(t(lang, "common_error"));
      // roll back the optimistic user bubble so the retry is clean
      setMessages((m) => m.slice(0, -1));
      setInput(q); // hand the question back instead of losing it
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card stack ask" id="ask">
      <div className="row-between">
        <h2 style={{ fontSize: "1.1rem", margin: 0 }}>
          {t(lang, "her_ask_title")}{" "}
          <span className="pill" style={{ verticalAlign: "middle" }}>
            {t(lang, "her_ai_name")}
          </span>
        </h2>
        <span className="pill">{t(lang, "her_ask_badge")}</span>
      </div>
      <p className="muted tiny" style={{ margin: 0 }}>{t(lang, "her_ask_sub")}</p>

      {messages.length === 0 && (
        <div className="ask-bubble ask-assistant">
          <span className="ask-src">{t(lang, "her_ai_name")}</span>
          <p style={{ margin: 0 }}>{t(lang, "her_ai_greet")}</p>
        </div>
      )}

      {messages.length > 0 && (
        <div className="ask-log" ref={logRef}>
          {messages.map((m, i) => (
            <div key={i} className={`ask-bubble ask-${m.role}`}>
              {m.role === "assistant" && m.source && (
                <span className="ask-src">
                  {m.source === "ai" ? t(lang, "her_ask_src_ai") : t(lang, "her_ask_src_data")}
                </span>
              )}
              <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{m.text}</p>
              {m.matches && m.matches.length > 0 && (
                <div className="ask-matches">
                  {m.matches.map((mt) => (
                    <Link key={mt.id} href={`/heritage/${mt.id}`} className="pill ask-chip">
                      {mt.name}
                      <span className="muted"> · {mt.governorate}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
          {busy && <div className="ask-bubble ask-assistant muted">{t(lang, "her_ask_thinking")}</div>}
        </div>
      )}

      <div className="row" style={{ flexWrap: "wrap" }}>
        {(messages.length === 0 ? suggestions : suggestions.slice(0, 2)).map((s) => (
          <button key={s} type="button" className="pill ask-suggest" onClick={() => ask(s)} disabled={busy}>
            {s}
          </button>
        ))}
      </div>

      {error && (
        <p className="field-err" style={{ margin: 0 }}>
          {error}{" "}
          {input && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => ask(input)} disabled={busy}>
              {t(lang, "her_ask_retry")}
            </button>
          )}
        </p>
      )}

      <form
        className="row"
        onSubmit={(e) => {
          e.preventDefault();
          ask(input);
        }}
      >
        <input
          className="input"
          style={{ flex: "1 1 220px" }}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t(lang, "her_ask_ph")}
          aria-label={t(lang, "her_ask_title")}
          maxLength={400}
        />
        <button className="btn btn-primary" type="submit" disabled={busy || !input.trim()}>
          {t(lang, "her_ask_send")}
        </button>
      </form>
    </section>
  );
}
