"use client";

import { useState } from "react";
import { t, type Lang } from "@/lib/i18n";

interface Props {
  workId: string;
  workLang: string;
  lang: Lang;
  /** Work category — used for the poetry layout of the translated text. */
  category?: string;
}

/** On-demand AI translation of a work (ar ↔ en). Never persisted. */
export default function TranslatePanel({ workId, workLang, lang, category }: Props) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [text, setText] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  const to = workLang === "ar" ? "en" : "ar";

  async function load() {
    if (busy) return;
    setBusy(true);
    setFailed(false);
    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: workId, to }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data?.errorKey || "failed");
      setText(data.translated);
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next && text === null && !failed) load();
  }

  return (
    <div style={{ margin: "0.6rem 0 0" }}>
      <button type="button" className="btn btn-ghost btn-sm" onClick={toggle} aria-expanded={open}>
        {t(lang, "work_translate")}
      </button>

      {open && (
        <div className="card" style={{ marginTop: "0.6rem" }}>
          <p className="tiny muted" style={{ margin: "0 0 0.5rem" }}>
            {t(lang, "work_translate_note")}
          </p>
          {busy && (
            <p className="muted translate-skeleton" style={{ margin: 0 }} aria-live="polite">
              {t(lang, "work_translating")}
            </p>
          )}
          {failed && (
            <p className="field-err" style={{ margin: "0 0 0.4rem" }}>
              {t(lang, "work_translate_fail")}
            </p>
          )}
          {failed && !busy && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={load}>
              {t(lang, "her_ask_retry")}
            </button>
          )}
          {text && (
            <div
              className={category === "poetry" ? "prose prose-poetry" : "prose"}
              style={{ whiteSpace: "pre-wrap" }}
              lang={to}
              dir={to === "ar" ? "rtl" : "ltr"}
            >
              {text}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
