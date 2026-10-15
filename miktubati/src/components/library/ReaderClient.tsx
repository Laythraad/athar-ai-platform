"use client";

/* My Library reader.
   • PDFs render in <canvas> via pdf.js — page nav, zoom, text-layer copy
   • last page is saved to the owner row and restored on reopen
   • private notes attach to the current page
   • My Library AI answers from the extracted text (whole doc, or this page) */

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { t, type Lang } from "@/lib/i18n";

interface Item {
  id: string;
  kind: string;
  title: string;
  fileUrl: string | null;
  content_text: string | null;
  pages_total: number | null;
  last_page: number;
  file_mime: string | null;
}

interface Note {
  id: string;
  page: number | null;
  body: string;
  created_at: string;
}

export default function ReaderClient({ lang }: { lang: Lang }) {
  const { id } = useParams<{ id: string }>();
  const [item, setItem] = useState<Item | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [zoom, setZoom] = useState(1.2);
  const [noteDraft, setNoteDraft] = useState("");
  const [aiQ, setAiQ] = useState("");
  const [aiOut, setAiOut] = useState<string | null>(null);
  const [aiBusy, setAiBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfRef = useRef<any>(null);
  const rendering = useRef(false);

  async function loadPdfjs() {
    const pdfjs = await import("pdfjs-dist");
    pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
    return pdfjs;
  }

  useEffect(() => {
    void (async () => {
      const res = await fetch(`/api/library/${id}`);
      if (res.status === 401) {
        setErr("auth_required");
        return;
      }
      const data = (await res.json()) as { ok?: boolean; item?: Item };
      if (!data.ok || !data.item) {
        setErr("item_not_found");
        return;
      }
      setItem(data.item);
      setPage(data.item.last_page || 1);
      const nres = await fetch(`/api/library/${id}/notes`);
      const ndata = (await nres.json()) as { ok?: boolean; notes?: Note[] };
      if (ndata.ok && ndata.notes) setNotes(ndata.notes);
    })();
  }, [id]);

  const renderPage = useCallback(
    async (p: number) => {
      if (!item?.fileUrl || item.kind !== "pdf") return;
      if (!pdfRef.current) {
        try {
          const pdfjs = await loadPdfjs();
          pdfRef.current = await pdfjs.getDocument({ url: item.fileUrl }).promise;
          setPages(pdfRef.current.numPages);
        } catch {
          setErr("pdf_load_failed");
          return;
        }
      }
      const pdf = pdfRef.current;
      if (!pdf || rendering.current) return;
      rendering.current = true;
      try {
        const pageNum = Math.min(Math.max(1, p), pdf.numPages);
        const pg = await pdf.getPage(pageNum);
        const viewport = pg.getViewport({ scale: zoom });
        const canvas = canvasRef.current;
        if (canvas) {
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext("2d");
          if (ctx) await pg.render({ canvasContext: ctx, viewport, canvas }).promise;
        }
      } finally {
        rendering.current = false;
      }
    },
    [item, zoom],
  );

  useEffect(() => {
    void renderPage(page);
  }, [page, renderPage]);

  useEffect(() => {
    if (!item || page < 1) return;
    const timer = setTimeout(() => {
      void fetch(`/api/library/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lastPage: page }),
      });
    }, 800);
    return () => clearTimeout(timer);
  }, [page, id, item]);

  async function addNote() {
    const body = noteDraft.trim();
    if (!body) return;
    const res = await fetch(`/api/library/${id}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body, page: item?.kind === "pdf" ? page : null }),
    });
    const data = (await res.json()) as { ok?: boolean; note?: Note };
    if (data.ok && data.note) setNotes((n) => [data.note!, ...n]);
    setNoteDraft("");
  }

  async function askAi(action?: string) {
    setAiBusy(true);
    setAiOut(null);
    try {
      const res = await fetch(`/api/library/${id}/ai`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: action ?? "ask",
          prompt: aiQ || undefined,
          page: item?.kind === "pdf" ? page : undefined,
          lang,
        }),
      });
      const data = (await res.json()) as { ok?: boolean; answer?: string; errorKey?: string };
      if (data.ok && data.answer) setAiOut(data.answer);
      else setErr(data.errorKey === "lib_no_text" ? t(lang, "lib_no_text") : t(lang, "common_error"));
    } catch {
      setErr(t(lang, "common_error"));
    } finally {
      setAiBusy(false);
    }
  }

  if (err && !item) {
    return (
      <p className="field-err" role="alert">
        {err === "auth_required" ? t(lang, "nav_signin") : t(lang, "common_error")}
      </p>
    );
  }
  if (!item) return <p className="muted">{t(lang, "common_loading")}</p>;

  return (
    <div className="stack">
      <div className="row-between" style={{ flexWrap: "wrap", gap: "0.5rem" }}>
        <h1 className="page-title" style={{ fontSize: "1.5rem" }}>
          {item.title}
        </h1>
        <span className="pill">🔒 {t(lang, "lib_privacy_note")}</span>
      </div>

      {item.kind === "pdf" && item.fileUrl && (
        <div className="card stack" style={{ gap: "0.6rem" }}>
          <div className="row" style={{ flexWrap: "wrap" }}>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              ‹
            </button>
            <span className="tiny">
              {t(lang, "lib_page")} {page} / {pages || item.pages_total || "?"}
            </span>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={pages > 0 && page >= pages}
            >
              ›
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setZoom((z) => Math.min(3, z + 0.2))}
            >
              {t(lang, "lib_zoom_in")}
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setZoom((z) => Math.max(0.6, z - 0.2))}
            >
              {t(lang, "lib_zoom_out")}
            </button>
          </div>
          <p className="tiny muted" style={{ margin: 0 }}>
            {t(lang, "lib_last_page_note")}
          </p>
          <div style={{ overflow: "auto", background: "var(--surface2)", borderRadius: 8 }}>
            <canvas ref={canvasRef} style={{ display: "block", margin: "0 auto", maxWidth: "100%" }} />
          </div>
        </div>
      )}

      {item.kind === "text" && (
        <div className="prose" style={{ whiteSpace: "pre-wrap", maxHeight: 480, overflow: "auto" }}>
          {item.content_text?.slice(0, 30000) ?? t(lang, "lib_no_text")}
        </div>
      )}

      {item.kind === "image" && item.fileUrl && (
        <div className="card" style={{ textAlign: "center" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={item.fileUrl} alt={item.title} style={{ maxWidth: "100%", borderRadius: 8 }} />
        </div>
      )}

      <div className="card stack" style={{ gap: "0.5rem" }}>
        <strong>{t(lang, "lib_ai_title")}</strong>
        <div className="row" style={{ flexWrap: "wrap" }}>
          {(["summarize", "ideas", "quiz", "terms"] as const).map((a) => (
            <button
              key={a}
              type="button"
              className="pill"
              style={{ cursor: "pointer" }}
              disabled={aiBusy}
              onClick={() => void askAi(a)}
            >
              {t(lang, `lib_ai_${a}`)}
            </button>
          ))}
        </div>
        <form
          className="row"
          onSubmit={(e) => {
            e.preventDefault();
            void askAi();
          }}
        >
          <input
            className="input"
            style={{ flex: "1 1 200px" }}
            value={aiQ}
            onChange={(e) => setAiQ(e.target.value)}
            placeholder={t(lang, "lib_ai_ph")}
            aria-label={t(lang, "lib_ai_title")}
          />
          <button className="btn btn-primary btn-sm" type="submit" disabled={aiBusy}>
            {t(lang, "her_ask_send")}
          </button>
        </form>
        <p className="tiny muted" style={{ margin: 0 }}>
          {t(lang, "lib_ai_page_hint")}
        </p>
        {aiBusy && (
          <p className="muted tiny" style={{ margin: 0 }}>
            {t(lang, "ai_thinking")}
          </p>
        )}
        {aiOut && (
          <div className="prose" style={{ whiteSpace: "pre-wrap" }}>
            {aiOut}
          </div>
        )}
      </div>

      <div className="card stack" style={{ gap: "0.5rem" }}>
        <strong>{t(lang, "lib_notes")}</strong>
        <form
          className="row"
          onSubmit={(e) => {
            e.preventDefault();
            void addNote();
          }}
        >
          <input
            className="input"
            style={{ flex: "1 1 200px" }}
            value={noteDraft}
            onChange={(e) => setNoteDraft(e.target.value)}
            placeholder={t(lang, "lib_note_ph")}
            aria-label={t(lang, "lib_notes")}
          />
          <button className="btn btn-primary btn-sm" type="submit">
            {t(lang, "lib_note_add")}
          </button>
        </form>
        {notes.map((n) => (
          <div key={n.id} className="card" style={{ padding: "0.6rem" }}>
            {n.page ? (
              <span className="tiny muted">
                {t(lang, "lib_page")} {n.page} ·{" "}
              </span>
            ) : null}
            <span>{n.body}</span>
          </div>
        ))}
      </div>

      {err && (
        <p className="field-err" role="alert">
          {err}
        </p>
      )}
    </div>
  );
}
