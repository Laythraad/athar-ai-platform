import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchWork, fetchAuthor, fetchAuthorRating, fetchReadingList } from "@/lib/queries";
import { isDbConfigured } from "@/lib/env";
import { t, catLabel, formatCount } from "@/lib/i18n";
import { getCurrentLang } from "@/lib/lang";
import { getSession } from "@/lib/session";
import { adminSupabase } from "@/lib/supabase/admin";
import ReportButton from "@/components/ReportButton";
import TranslatePanel from "@/components/TranslatePanel";
import ReadingControls from "@/components/ReadingControls";

export const instant = false;

export default async function WorkPage({ params }: { params: Promise<{ id: string }> }) {
  const lang = await getCurrentLang();
  const { id } = await params;

  if (!isDbConfigured()) {
    return (
      <div className="panel">
        <div className="status-note">{t(lang, "common_offline_db")}</div>
      </div>
    );
  }

  const work = await fetchWork(id);
  if (!work) notFound();

  // Best-effort read-count increment via the service role (RLS would block a
  // normal user from updating someone else's work). Keeps "Most read" honest.
  // Atomic: bump_read_count does the increment and returns the new value in a
  // single UPDATE, so concurrent loads can't lose counts (read-then-write
  // raced). Best-effort — a read-count failure must never break the page.
  const admin = adminSupabase();
  if (admin) {
    // supabase-js returns { data, error } — it does not throw, so check it.
    const { data: bumped, error: bumpErr } = await admin.rpc("bump_read_count", { p_work_id: id });
    if (!bumpErr && typeof bumped === "number") work.read_count = bumped;
  }

  const author = await fetchAuthor(work.author_id);
  const session = await getSession();
  const signedIn = Boolean(session?.userId);
  let shelfStatus = "";
  if (signedIn && session?.userId) {
    const list = await fetchReadingList(session.userId);
    shelfStatus = list.find((r) => r.work_id === work.id)?.status ?? "";
  }
  // The star score shown next to a work is the AUTHOR's aggregate rating —
  // the schema has no per-work ratings — so label it honestly.
  const authorRating = await fetchAuthorRating(work.author_id);
  const avg = authorRating.avg;
  const count = authorRating.count;

  // A published work may be an uploaded file (PDF-first) instead of / as well
  // as inline text. PDFs render inline; plain text renders too; anything else
  // falls back to the signed-URL link.
  const fileMime = work.file_mime ?? "";
  const hasFile = Boolean(work.file_path);
  const isPdf = fileMime.includes("pdf") || /\.pdf$/i.test(work.file_path ?? "");
  const canPreview = isPdf || fileMime.startsWith("text/plain");

  return (
    <div className="stack" style={{ maxWidth: "760px" }}>
      <div className="row-between">
        <span className="pill">{catLabel(lang, work.category)}</span>
        <span className="pill">{t(lang, "lib_unverified")}</span>
      </div>

      <h1 className="page-title">{work.title}</h1>

      <p className="work-meta">
        <span>
          {t(lang, "lib_by")}{" "}
          <Link href={`/author/${work.author_id}`}>{author?.pen_name ?? "—"}</Link>
        </span>
        {work.published_at && (
          <span>
            {new Date(work.published_at).toLocaleDateString(lang === "ar" ? "ar-IQ" : "en-GB")}
          </span>
        )}
        {count > 0 && (
          <span title={t(lang, "work_author_rating")}>
            ★ {avg.toFixed(1)} ({count}) · {t(lang, "work_author_rating")}
          </span>
        )}
      </p>

      {work.description && <p className="page-sub">{work.description}</p>}

      <section className="card">
        <div className="row-between" style={{ marginBottom: "0.5rem" }}>
          <h2 style={{ fontSize: "1.05rem", margin: 0 }}>
            {hasFile ? t(lang, "work_file") : t(lang, "work_content")}
          </h2>
          {typeof work.read_count === "number" && work.read_count > 0 && (
            <span className="tiny muted">
              {formatCount(lang, work.read_count, "read")}
            </span>
          )}
        </div>

        {hasFile && (
          <div className="file-viewer">
            {canPreview ? (
              <iframe
                className="file-frame"
                src={`/api/work-file?id=${work.id}&view=1`}
                title={work.title}
              />
            ) : (
              <p className="muted file-note" style={{ margin: 0 }}>
                {t(lang, "work_file_unavailable")}
              </p>
            )}
            <div className="row file-actions">
              {work.allow_download ? (
                <a href={`/api/work-file?id=${work.id}`} className="btn btn-primary btn-sm">
                  {t(lang, "work_download")}
                </a>
              ) : (
                <a href={`/api/work-file?id=${work.id}&view=1`} className="btn btn-primary btn-sm">
                  {t(lang, "work_read")}
                </a>
              )}
              {fileMime && <span className="tiny muted">{fileMime}</span>}
            </div>
          </div>
        )}

        {work.content ? (
          hasFile ? (
            <details className="extracted-text">
              <summary>{t(lang, "work_extracted_text")}</summary>
              <div
                className={work.category === "poetry" ? "prose prose-poetry" : "prose"}
                style={{ whiteSpace: "pre-wrap" }}
              >
                {work.content}
              </div>
            </details>
          ) : (
            <div
              className={work.category === "poetry" ? "prose prose-poetry" : "prose"}
              style={{ whiteSpace: "pre-wrap" }}
            >
              {work.content}
            </div>
          )
        ) : (
          !hasFile && (
            <p className="muted" style={{ margin: 0 }}>
              {t(lang, "work_no_content")}
            </p>
          )
        )}

        {work.content && (
          <TranslatePanel workId={work.id} workLang={work.language} lang={lang} category={work.category} />
        )}
      </section>

      {work.tags && work.tags.length > 0 && (
        <div className="row">
          {work.tags.map((tag) => (
            <Link key={tag} href={`/library?q=${encodeURIComponent(tag)}`} className="pill">
              #{tag}
            </Link>
          ))}
        </div>
      )}

      <section className="card stack" style={{ gap: "0.55rem" }}>
        <h2 style={{ fontSize: "1rem", margin: 0 }}>{t(lang, "work_add_shelf")}</h2>
        {signedIn ? (
          <ReadingControls workId={work.id} current={shelfStatus} lang={lang} />
        ) : (
          <p className="muted" style={{ margin: 0 }}>
            <Link href={`/signin?next=/work/${work.id}`} className="btn btn-ghost btn-sm">
              {t(lang, "work_signin_save")}
            </Link>
          </p>
        )}
      </section>

      <div className="row">
        {signedIn ? (
          <ReportButton workId={work.id} lang={lang} />
        ) : (
          <Link href={`/signin?next=/work/${work.id}`} className="btn btn-ghost btn-sm">
            {t(lang, "nav_signin")}
          </Link>
        )}
      </div>
    </div>
  );
}