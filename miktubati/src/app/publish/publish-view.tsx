"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { browserSupabase } from "@/lib/supabase/client";
import { t, catLabel, type Lang } from "@/lib/i18n";
import { useLang } from "@/lib/useLang";

const CATEGORIES = [
  { slug: "poetry", key: "cat_poetry" },
  { slug: "novels", key: "cat_novels" },
  { slug: "short", key: "cat_short" },
  { slug: "history", key: "cat_history" },
  { slug: "essays", key: "cat_essays" },
  { slug: "heritage", key: "cat_heritage" },
  { slug: "science", key: "cat_science" },
  { slug: "space", key: "cat_space" },
  { slug: "children", key: "cat_children" },
  { slug: "other", key: "cat_other" },
] as const;

const LANGS_OPT = [
  { code: "ar", label: "العربية" },
  { code: "en", label: "English" },
] as const;

const MAX_PDF_BYTES = 20 * 1024 * 1024;

/* Server-side Zod messages are i18n KEY sentinels (val_rights, …). Render the
   ones we know; anything else is shown as-is (shouldn't happen). */
function localFieldErr(lang: Lang, msg: string): string {
  const known = ["val_rights", "val_content_or_file", "val_file_type", "val_file_size"];
  return known.includes(msg) ? t(lang, msg) : msg;
}

interface PublishResult {
  status: string;
  verdict: string;
  source: string;
  categories: string[];
  reasons: string[];
  errorKey?: string | null;
}

interface AttachedFile {
  path: string;
  mime: string;
  size: number | null;
  hash: string | null;
}

function formatBytes(n: number | null | undefined): string {
  if (!n || n <= 0) return "";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export default function PublishView({
  initialLang,
  editId,
}: {
  initialLang: Lang;
  editId?: string | null;
}) {
  const lang = useLang(initialLang);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(1);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>("poetry");
  const [tags, setTags] = useState("");
  const [content, setContent] = useState("");
  const [language, setLanguage] = useState<"ar" | "en">("ar");
  const [allowDownload, setAllowDownload] = useState(false);
  const [ownsRights, setOwnsRights] = useState(false);

  // PDF: `picked` is a file the author just chose (not uploaded yet);
  // `attached` is the work's current stored file (edit) or a fresh upload.
  const [picked, setPicked] = useState<File | null>(null);
  const [attached, setAttached] = useState<AttachedFile | null>(null);
  const [dragging, setDragging] = useState(false);

  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(Boolean(editId));
  const [err, setErr] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [result, setResult] = useState<PublishResult | null>(null);

  const hasFile = Boolean(picked || attached);
  // Text stays editable only for works that already have it, so existing
  // text works aren't locked — new publications are PDF-first.
  const [hasInlineText, setHasInlineText] = useState(false);
  const showContentField = Boolean(editId) && hasInlineText;

  // When editing, prefill the form from the author's existing work (RLS lets
  // the author read their own).
  useEffect(() => {
    if (!editId) return;
    let cancelled = false;
    const sb = browserSupabase();
    void (async () => {
      if (sb) {
        const { data } = await sb
          .from("works")
          .select(
            "title, description, category, tags, content, language, allow_download, file_path, file_mime, file_size, file_hash",
          )
          .eq("id", editId)
          .maybeSingle();
        if (!cancelled && data) {
          setTitle(data.title ?? "");
          setDescription(data.description ?? "");
          setCategory(data.category ?? "poetry");
          setTags(Array.isArray(data.tags) ? data.tags.join(", ") : "");
          setContent(data.content ?? "");
          setHasInlineText(Boolean((data.content ?? "").trim()));
          setLanguage(data.language === "en" ? "en" : "ar");
          setAllowDownload(Boolean(data.allow_download));
          if (data.file_path) {
            setAttached({
              path: data.file_path,
              mime: data.file_mime ?? "application/pdf",
              size: (data.file_size ?? null) as number | null,
              hash: (data.file_hash ?? null) as string | null,
            });
          }
          setStep(2);
        }
      }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [editId]);

  function pickFile(f: File | undefined | null) {
    if (!f) return;
    setErr(null);
    const isPdf =
      f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      setFieldErrors({ file: t(lang, "pub_file_bad_type") });
      return;
    }
    if (f.size > MAX_PDF_BYTES) {
      setFieldErrors({ file: t(lang, "pub_file_too_big") });
      return;
    }
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next.file;
      return next;
    });
    setPicked(f);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    pickFile(e.dataTransfer.files?.[0]);
  }

  async function uploadPicked(): Promise<AttachedFile | null> {
    if (!picked) return attached;
    const fd = new FormData();
    fd.append("file", picked);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      path?: string;
      mime?: string;
      size?: number;
      hash?: string;
      errorKey?: string;
    };
    if (!res.ok || !data.ok || !data.path) {
      const map: Record<string, string> = {
        file_type_not_allowed: "pub_file_bad_type",
        file_too_large: "pub_file_too_big",
        not_a_pdf: "pub_file_bad",
      };
      const key = map[data.errorKey ?? ""] ?? "pub_file_upload_fail";
      throw new Error(t(lang, key));
    }
    const next: AttachedFile = {
      path: data.path,
      mime: data.mime ?? "application/pdf",
      size: data.size ?? null,
      hash: data.hash ?? null,
    };
    setAttached(next);
    setPicked(null);
    return next;
  }

  function stepOneOk(): boolean {
    return title.trim().length > 0 && (Boolean(editId) || hasFile);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    setFieldErrors({});
    setResult(null);

    // Track a freshly-uploaded file so we can delete it if publish fails
    // (otherwise a 20MB orphan stays in storage forever).
    let freshUpload: AttachedFile | null = null;

    try {
      if (!editId && !hasFile) {
        setFieldErrors({ file: t(lang, "pub_file_required") });
        setStep(1);
        setBusy(false);
        return;
      }
      if (!ownsRights) {
        setFieldErrors({ ownsRights: t(lang, "val_rights") });
        setBusy(false);
        return;
      }

      const uploaded = await uploadPicked();
      if (uploaded && !editId) freshUpload = uploaded;

      const res = await fetch("/api/publish", {
        method: editId ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...(editId ? { id: editId } : {}),
          title,
          description,
          category,
          tags: tags.split(",").map((s) => s.trim()).filter(Boolean),
          content,
          language,
          allowDownload,
          ...(uploaded
            ? {
                filePath: uploaded.path,
                fileMime: uploaded.mime,
                fileSize: uploaded.size,
                fileHash: uploaded.hash,
              }
            : {}),
          ownsRights,
        }),
      });

      const data = (await res.json().catch(() => ({}))) as PublishResult & {
        ok?: boolean;
        errorKey?: string;
        errors?: Record<string, string>;
      };

      if (res.status === 422 && data.errors) {
        const localized: Record<string, string> = {};
        for (const [k, v] of Object.entries(data.errors)) {
          localized[k] = localFieldErr(lang, v);
        }
        setFieldErrors(localized);
        if (localized.content || localized.file || localized.fileMime) setStep(2);
        if (localized.ownsRights || localized.title) setStep(3);
        // Clean up the orphan we just uploaded (edit-mode keeps the old file).
        if (freshUpload) {
          const sb = browserSupabase();
          if (sb) {
            await sb.storage.from("work-files").remove([freshUpload.path]).catch(() => undefined);
          }
        }
        setBusy(false);
        return;
      }

      if (!res.ok) {
        const key = data.errorKey ?? "";
        if (freshUpload) {
          const sb = browserSupabase();
          if (sb) {
            await sb.storage.from("work-files").remove([freshUpload.path]).catch(() => undefined);
          }
        }
        setErr(
          key === "auth_required"
            ? t(lang, "auth_signin_required")
            : key === "email_unverified"
              ? t(lang, "auth_email_unverified")
              : key === "duplicate_title"
                ? t(lang, "pub_duplicate")
                : key === "account_blocked"
                  ? (lang === "ar" ? "حسابك معلّق." : "Your account is suspended.")
                  : t(lang, "pub_fail"),
        );
        setBusy(false);
        return;
      }

      setResult({
        status: data.status,
        verdict: data.verdict,
        source: data.source,
        categories: data.categories ?? [],
        reasons: data.reasons ?? [],
        errorKey: data.errorKey ?? null,
      });
      setBusy(false);
    } catch (e2) {
      if (freshUpload) {
        const sb = browserSupabase();
        if (sb) {
          await sb.storage.from("work-files").remove([freshUpload.path]).catch(() => undefined);
        }
      }
      setErr(e2 instanceof Error ? e2.message : t(lang, "pub_fail"));
      setBusy(false);
    }
  }

  if (result) {
    const published = result.status === "published";
    const rejected = result.status === "rejected";

    return (
      <div className="panel-wide card stack">
        <h1 className="page-title">{t(lang, "pub_result_title")}</h1>

        <p
          className={`status-note ${published ? "ok-note" : rejected ? "error-note" : ""}`}
          style={{ margin: 0 }}
        >
          <strong>
            {published
              ? t(lang, "pub_status_published")
              : rejected
                ? t(lang, "pub_status_rejected")
                : t(lang, "pub_status_pending")}
          </strong>
          <br />
          {t(lang, "pub_status_source")}
          {result.source === "rules"
            ? t(lang, "pub_src_rules")
            : result.source === "ai"
              ? "AI"
              : t(lang, "pub_src_system")}
        </p>

        {result.errorKey && (
          <p className="status-note" style={{ margin: 0 }}>
            {t(lang, "pub_ai_failed_note")}
          </p>
        )}

        {result.categories.length > 0 && (
          <div>
            <p className="tiny muted" style={{ margin: "0 0 0.3rem" }}>
              {t(lang, "common_categories")}
            </p>
            <div className="row">
              {result.categories.map((c) => (
                <span key={c} className="pill">
                  {catLabel(lang, c)}
                </span>
              ))}
            </div>
          </div>
        )}

        {result.reasons.length > 0 && (
          <div>
            <p className="tiny muted" style={{ margin: "0 0 0.3rem" }}>
              {t(lang, "common_reasons")}
            </p>
            <ul className="prose">
              {result.reasons.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="row">
          <button className="btn btn-primary btn-sm" onClick={() => router.push("/my-works")}>
            {t(lang, "nav_myworks")}
          </button>
          {!editId && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => {
                setResult(null);
                setTitle("");
                setContent("");
                setDescription("");
                setTags("");
                setPicked(null);
                setAttached(null);
                setAllowDownload(false);
                setOwnsRights(false);
                setStep(1);
              }}
            >
              {t(lang, "pub_publish_another")}
            </button>
          )}
        </div>
      </div>
    );
  }

  if (loading) {
    return <p className="muted">{t(lang, "common_loading")}</p>;
  }

  const attachedSize = attached ? formatBytes(attached.size) : "";
  const fileLabel = picked
    ? picked.name
    : attached
      ? `${t(lang, "pub_file")}${attachedSize ? ` · ${attachedSize}` : ""}`
      : null;

  const submitHint = !ownsRights
    ? t(lang, "pub_hint_rights")
    : !editId && !hasFile
      ? t(lang, "pub_hint_file")
      : null;

  const steps = ["pub_step_file", "pub_step_details", "pub_step_publish"] as const;

  return (
    <div className="panel-wide">
      <h1 className="page-title">{editId ? t(lang, "pub_edit_title") : t(lang, "pub_title")}</h1>
      <p className="page-sub">{t(lang, "pub_sub")}</p>

      <div className="stepper" aria-label={t(lang, "pub_step", { n: step, total: 3 })}>
        {steps.map((s, i) => {
          const n = i + 1;
          return (
            <span
              key={s}
              className={`step-chip${n === step ? " is-on" : n < step ? " is-done" : ""}`}
            >
              <span className="step-num">{n}</span>
              {t(lang, s)}
            </span>
          );
        })}
      </div>

      <form className="card form" onSubmit={submit}>
        {/* ── STEP 1: file + title ── */}
        {step === 1 && (
          <>
            <label className="field">
              {t(lang, "pub_t")}
              <input
                className="input"
                value={title}
                maxLength={200}
                required
                onChange={(e) => setTitle(e.target.value)}
              />
              {fieldErrors.title && (
                <span className="tiny field-err">{fieldErrors.title}</span>
              )}
            </label>

            <div className="field">
              <span className="field-label">{t(lang, "pub_file")}</span>

              <label
                className={`dropzone${dragging ? " is-drag" : ""}${hasFile ? " has-file" : ""}`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept="application/pdf,.pdf"
                  hidden
                  onChange={(e) => {
                    pickFile(e.target.files?.[0]);
                    e.target.value = "";
                  }}
                />
                <span className="dz-badge">PDF</span>
                <span className="dz-name">{fileLabel ?? t(lang, "pub_file_drop")}</span>
                {!fileLabel && <span className="dz-hint">{t(lang, "pub_file_hint")}</span>}

                {fileLabel && (
                  <span className="dz-actions">
                    <span className="dz-btn">{t(lang, "pub_file_change")}</span>
                    {picked && (
                      <button
                        type="button"
                        className="dz-btn dz-btn-danger"
                        onClick={() => setPicked(null)}
                      >
                        {t(lang, "pub_file_remove")}
                      </button>
                    )}
                  </span>
                )}
              </label>

              {fieldErrors.file && <span className="tiny field-err">{fieldErrors.file}</span>}
            </div>

            <div className="row">
              <button
                type="button"
                className="btn btn-primary"
                disabled={!stepOneOk()}
                onClick={() => {
                  setErr(null);
                  setStep(2);
                }}
              >
                {t(lang, "pub_next")}
              </button>
            </div>
          </>
        )}

        {/* ── STEP 2: details ── */}
        {step === 2 && (
          <>
            <label className="field">
              {t(lang, "pub_desc")}
              <textarea
                className="textarea"
                rows={2}
                maxLength={2000}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </label>

            <div className="row">
              <label className="field" style={{ flex: "1 1 180px" }}>
                {t(lang, "pub_cat")}
                <select
                  className="select"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.slug} value={c.slug}>
                      {t(lang, c.key)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field" style={{ flex: "0 1 160px" }}>
                {t(lang, "pub_lang")}
                <select
                  className="select"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as "ar" | "en")}
                >
                  {LANGS_OPT.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="field">
              {t(lang, "pub_tags")}
              <input
                className="input"
                value={tags}
                placeholder={lang === "ar" ? "شعر, نهر, بغداد" : "poetry, river, baghdad"}
                onChange={(e) => setTags(e.target.value)}
              />
            </label>

            {showContentField && (
              <label className="field">
                {t(lang, "pub_content")}
                <textarea
                  className="textarea textarea-lg"
                  rows={12}
                  value={content}
                  placeholder={t(lang, "pub_content_ph")}
                  onChange={(e) => setContent(e.target.value)}
                />
                {fieldErrors.content && (
                  <span className="tiny field-err">{fieldErrors.content}</span>
                )}
              </label>
            )}

            <label className="row" style={{ cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={allowDownload}
                onChange={(e) => setAllowDownload(e.target.checked)}
              />
              <span>{t(lang, "pub_download")}</span>
            </label>

            {fieldErrors.content && step === 2 && (
              <p className="tiny field-err" style={{ margin: 0 }}>
                {fieldErrors.content}
              </p>
            )}

            <div className="row">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setStep(1)}
              >
                {t(lang, "pub_back")}
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setStep(3)}
              >
                {t(lang, "pub_next")}
              </button>
            </div>
          </>
        )}

        {/* ── STEP 3: review + rights + submit ── */}
        {step === 3 && (
          <>
            <h2 style={{ fontSize: "1.05rem", margin: 0 }}>{t(lang, "pub_live_preview")}</h2>
            <div className="preview-box prose" lang={language} dir={language === "ar" ? "rtl" : "ltr"}>
              <p style={{ fontWeight: 700, fontSize: "1.15rem", margin: "0 0 0.3rem" }}>
                {title || "—"}
              </p>
              <p className="tiny muted" style={{ margin: "0 0 0.4rem" }}>
                {catLabel(lang, category)} · {language === "ar" ? "العربية" : "English"}
                {tags
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean)
                  .map((tg) => (
                    <span key={tg} className="pill" style={{ marginInlineStart: "0.3rem" }}>
                      #{tg}
                    </span>
                  ))}
              </p>
              {description && <p style={{ margin: "0 0 0.4rem" }}>{description}</p>}
              {content.trim() && (
                <p style={{ whiteSpace: "pre-wrap", maxHeight: 200, overflow: "auto", margin: 0 }}>
                  {content.slice(0, 600)}
                  {content.length > 600 ? "…" : ""}
                </p>
              )}
              {fileLabel && (
                <p className="tiny muted" style={{ margin: "0.3rem 0 0" }}>
                  📄 {fileLabel}
                </p>
              )}
            </div>

            <label className="row" style={{ cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={ownsRights}
                onChange={(e) => setOwnsRights(e.target.checked)}
              />
              <span>{t(lang, "pub_own")}</span>
            </label>
            {fieldErrors.ownsRights && (
              <span className="tiny field-err">{fieldErrors.ownsRights}</span>
            )}

            {err && (
              <p className="status-note error-note" style={{ margin: 0 }} role="alert">
                {err}
              </p>
            )}

            <div className="row">
              <button type="button" className="btn btn-ghost" onClick={() => setStep(2)}>
                {t(lang, "pub_back")}
              </button>
              <button className="btn btn-primary" type="submit" disabled={busy || !ownsRights}>
                {busy
                  ? editId
                    ? t(lang, "pub_updating")
                    : t(lang, "pub_submitting")
                  : editId
                    ? t(lang, "pub_update")
                    : t(lang, "pub_submit")}
              </button>
            </div>
            {submitHint && (
              <p className="form-hint" style={{ margin: 0 }}>
                {submitHint}
              </p>
            )}
          </>
        )}
      </form>
    </div>
  );
}
