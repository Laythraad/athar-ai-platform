"use client";

/* Creative Studio — private drafts (poem / story / note) with AI editing
   suggestions. Publishing to the community goes through the existing
   moderated /api/publish flow, never direct INSERT into works. */

import { useCallback, useEffect, useState } from "react";
import { t, type Lang } from "@/lib/i18n";

interface StudioWork {
  id: string;
  kind: "poem" | "story" | "note";
  title: string;
  body: string;
  updated_at: string;
}

export default function StudioClient({ lang }: { lang: Lang }) {
  const [works, setWorks] = useState<StudioWork[]>([]);
  const [loading, setLoading] = useState(true);
  const [kind, setKind] = useState<"poem" | "story" | "note">("poem");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [aiOut, setAiOut] = useState<string | null>(null);
  const [aiBusy, setAiBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/studio");
      if (res.status === 401) return;
      const data = (await res.json()) as { ok?: boolean; works?: StudioWork[] };
      if (data.ok && data.works) setWorks(data.works);
    } catch {
      setErr(t(lang, "common_error"));
    } finally {
      setLoading(false);
    }
  }, [lang]);

  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      void load();
    });
    return () => cancelAnimationFrame(raf);
  }, [load]);

  async function save() {
    setErr(null);
    const payload = { kind, title, body };
    const res = await fetch(editingId ? `/api/studio/${editingId}` : "/api/studio", {
      method: editingId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await res.json()) as { ok?: boolean };
    if (!data.ok) {
      setErr(t(lang, "studio_save_fail"));
      return;
    }
    setTitle("");
    setBody("");
    setEditingId(null);
    await load();
  }

  function edit(w: StudioWork) {
    setEditingId(w.id);
    setKind(w.kind);
    setTitle(w.title);
    setBody(w.body);
    setAiOut(null);
  }

  async function remove(id: string) {
    if (!confirm(t(lang, "studio_delete_confirm"))) return;
    setWorks((prev) => prev.filter((w) => w.id !== id));
    await fetch(`/api/studio/${id}`, { method: "DELETE" });
  }

  async function aiAssist(action: "ideas" | "edit") {
    setAiBusy(true);
    setAiOut(null);
    try {
      const res = await fetch("/api/athar-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          q:
            action === "ideas"
              ? `${t(lang, "studio_ai_ideas_q")}\n${(title + "\n" + body).slice(0, 1500)}`
              : `${t(lang, "studio_ai_edit_q")}\n${(title + "\n" + body).slice(0, 1500)}`,
          lang,
          web: false,
        }),
      });
      const data = (await res.json()) as { ok?: boolean; answer?: string };
      if (data.ok && data.answer) setAiOut(data.answer);
      else setErr(t(lang, "common_error"));
    } catch {
      setErr(t(lang, "common_error"));
    } finally {
      setAiBusy(false);
    }
  }

  return (
    <div className="stack">
      <div className="card stack" style={{ gap: "0.5rem" }}>
        <strong>{editingId ? t(lang, "studio_editing") : t(lang, "studio_new")}</strong>
        <div className="row" style={{ flexWrap: "wrap" }}>
          {(["poem", "story", "note"] as const).map((k) => (
            <button
              key={k}
              type="button"
              className={`pill${kind === k ? " pill-published" : ""}`}
              style={{ cursor: "pointer" }}
              onClick={() => setKind(k)}
            >
              {t(lang, `studio_kind_${k}`)}
            </button>
          ))}
        </div>
        <input
          className="input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t(lang, "studio_title_ph")}
          aria-label={t(lang, "studio_title_ph")}
        />
        <textarea
          className="textarea"
          rows={10}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={t(lang, "studio_body_ph")}
          aria-label={t(lang, "studio_body_ph")}
        />
        <div className="row" style={{ flexWrap: "wrap" }}>
          <button type="button" className="btn btn-primary btn-sm" onClick={() => void save()}>
            {t(lang, "studio_save_draft")}
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            disabled={aiBusy || !body.trim()}
            onClick={() => void aiAssist("ideas")}
          >
            {t(lang, "studio_ai_ideas")}
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            disabled={aiBusy || !body.trim()}
            onClick={() => void aiAssist("edit")}
          >
            {t(lang, "studio_ai_edit")}
          </button>
          {editingId && (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => {
                setEditingId(null);
                setTitle("");
                setBody("");
              }}
            >
              {t(lang, "common_cancel")}
            </button>
          )}
        </div>
        <p className="tiny muted" style={{ margin: 0 }}>
          {t(lang, "studio_private_note")}
        </p>
        {aiOut && (
          <div className="prose" style={{ whiteSpace: "pre-wrap" }}>
            {aiOut}
          </div>
        )}
      </div>

      {err && (
        <p className="field-err" role="alert">
          {err}
        </p>
      )}

      <h2 style={{ fontSize: "1.1rem", margin: 0 }}>{t(lang, "studio_drafts")}</h2>
      {loading ? (
        <p className="muted">{t(lang, "common_loading")}</p>
      ) : works.length === 0 ? (
        <p className="muted">{t(lang, "studio_empty")}</p>
      ) : (
        <div className="grid-cards">
          {works.map((w) => (
            <div key={w.id} className="card work-card stack" style={{ gap: "0.35rem" }}>
              <span className="pill">{t(lang, `studio_kind_${w.kind}`)}</span>
              <strong>{w.title || t(lang, "studio_untitled")}</strong>
              <span className="tiny muted">{w.body.slice(0, 80)}…</span>
              <div className="row">
                <button type="button" className="btn btn-primary btn-sm" onClick={() => edit(w)}>
                  {t(lang, "studio_edit")}
                </button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => void remove(w.id)}>
                  {t(lang, "lib_delete")}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
