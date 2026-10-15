"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { t, type Lang } from "@/lib/i18n";

interface LibItem {
  id: string;
  kind: "pdf" | "text" | "image" | "note";
  title: string;
  file_mime: string | null;
  file_size: number | null;
  is_favorite: boolean;
  last_page: number;
  last_opened_at: string | null;
  created_at: string;
}

const MAX_BYTES = 25 * 1024 * 1024;

function formatBytes(n: number | null): string {
  if (!n) return "";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export default function LibraryClient({ lang }: { lang: Lang }) {
  const router = useRouter();
  const [items, setItems] = useState<LibItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"new" | "title">("new");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/library");
      const data = (await res.json()) as { ok?: boolean; items?: LibItem[]; errorKey?: string };
      if (res.status === 401) {
        router.push("/signin?next=/my-library");
        return;
      }
      if (data.ok && data.items) setItems(data.items);
    } catch {
      setErr(t(lang, "common_error"));
    } finally {
      setLoading(false);
    }
  }, [lang, router]);

  useEffect(() => {
    // defer past the synchronous render phase (react-hooks/set-state-in-effect)
    const raf = requestAnimationFrame(() => {
      void load();
    });
    return () => cancelAnimationFrame(raf);
  }, [load]);

  async function upload(f: File | undefined | null) {
    if (!f) return;
    setErr(null);
    const mime = (f.type || "").toLowerCase();
    const allowed = ["application/pdf", "text/plain", "text/markdown", "image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(mime)) {
      setErr(t(lang, "lib_bad_type"));
      return;
    }
    if (f.size > MAX_BYTES) {
      setErr(t(lang, "lib_too_big"));
      return;
    }
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", f);
      const res = await fetch("/api/library", { method: "POST", body: fd });
      const data = (await res.json()) as { ok?: boolean; errorKey?: string };
      if (!res.ok || !data.ok) throw new Error(data?.errorKey || "fail");
      await load();
    } catch {
      setErr(t(lang, "lib_upload_fail"));
    } finally {
      setBusy(false);
    }
  }

  async function toggleFav(item: LibItem) {
    setItems((prev) => prev.map((x) => (x.id === item.id ? { ...x, is_favorite: !item.is_favorite } : x)));
    await fetch(`/api/library/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isFavorite: !item.is_favorite }),
    });
  }

  async function remove(item: LibItem) {
    if (!confirm(t(lang, "lib_delete_confirm"))) return;
    setItems((prev) => prev.filter((x) => x.id !== item.id));
    await fetch(`/api/library/${item.id}`, { method: "DELETE" });
  }

  const filtered = items
    .filter((it) => !q.trim() || it.title.toLowerCase().includes(q.trim().toLowerCase()))
    .sort((a, b) =>
      sort === "title"
        ? a.title.localeCompare(b.title)
        : new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );

  const kindIcon = (k: string) => (k === "pdf" ? "📄" : k === "image" ? "🖼️" : k === "note" ? "📝" : "📃");

  return (
    <div className="stack">
      <label
        className={`dropzone${dragging ? " is-drag" : ""}`}
        style={{ flex: "1 1 260px" }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          void upload(e.dataTransfer.files?.[0]);
        }}
      >
        <input
          type="file"
          hidden
          accept="application/pdf,.pdf,.txt,.md,image/jpeg,image/png,image/webp"
          onChange={(e) => {
            void upload(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
        <span className="dz-name">{busy ? t(lang, "lib_processing") : `＋ ${t(lang, "lib_upload")}`}</span>
        <span className="dz-hint">{t(lang, "lib_drop")}</span>
      </label>

      <div className="row" style={{ flexWrap: "wrap" }}>
        <input
          className="input"
          style={{ flex: "1 1 200px" }}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t(lang, "lib_search")}
          aria-label={t(lang, "lib_search")}
        />
        <select className="select" value={sort} onChange={(e) => setSort(e.target.value as "new" | "title")}>
          <option value="new">{t(lang, "lib_sort_new")}</option>
          <option value="title">{t(lang, "lib_sort_title")}</option>
        </select>
      </div>

      <p className="tiny muted" style={{ margin: 0 }}>
        🔒 {t(lang, "lib_privacy_note")}
      </p>

      {err && (
        <p className="field-err" style={{ margin: 0 }} role="alert">
          {err}
        </p>
      )}

      {loading ? (
        <p className="muted">{t(lang, "common_loading")}</p>
      ) : filtered.length === 0 ? (
        <p className="muted">{t(lang, "lib_empty")}</p>
      ) : (
        <div className="grid-cards">
          {filtered.map((it) => (
            <div key={it.id} className="card work-card stack" style={{ gap: "0.4rem" }}>
              <div className="row-between">
                <span className="pill">
                  {kindIcon(it.kind)} {t(lang, `lib_type_${it.kind}`)}
                </span>
                <button
                  type="button"
                  className="pill"
                  style={{ cursor: "pointer", border: 0, background: "transparent" }}
                  onClick={() => void toggleFav(it)}
                  aria-label={t(lang, "lib_fav")}
                >
                  {it.is_favorite ? "★" : "☆"}
                </button>
              </div>
              <strong>{it.title}</strong>
              <span className="tiny muted">
                {formatBytes(it.file_size)}
                {it.last_page > 1 ? ` · ${t(lang, "lib_page")} ${it.last_page}` : ""}
              </span>
              <div className="row">
                {it.kind === "pdf" || it.kind === "text" ? (
                  <Link href={`/my-library/${it.id}/read`} className="btn btn-primary btn-sm">
                    {t(lang, "lib_read")}
                  </Link>
                ) : (
                  <Link href={`/my-library/${it.id}`} className="btn btn-primary btn-sm">
                    {t(lang, "lib_open")}
                  </Link>
                )}
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => void remove(it)}>
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
