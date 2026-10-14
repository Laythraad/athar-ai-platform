import Link from "next/link";
import { getSession } from "@/lib/session";
import { fetchMyWorks } from "@/lib/queries";
import { isDbConfigured } from "@/lib/env";
import { t, catLabel, formatCount } from "@/lib/i18n";
import { getCurrentLang } from "@/lib/lang";
import MyWorkActions from "@/components/MyWorkActions";

export const instant = false;

const STATUS_KEY: Record<string, string> = {
  draft: "mw_status_draft",
  pending_review: "mw_status_pending",
  published: "mw_status_published",
  rejected: "mw_status_rejected",
};

const STATUS_CLASS: Record<string, string> = {
  draft: "pill pill-draft",
  pending_review: "pill pill-pending",
  published: "pill pill-published",
  rejected: "pill pill-rejected",
};

export default async function MyWorksPage() {
  const lang = await getCurrentLang();

  if (!isDbConfigured()) {
    return (
      <div className="panel">
        <div className="status-note">{t(lang, "common_offline_db")}</div>
      </div>
    );
  }

  const s = await getSession();
  if (!s.userId || s.stage !== "member") {
    return (
      <div className="panel card">
        <p style={{ margin: 0 }}>
          <Link href="/signin?next=/my-works">{t(lang, "auth_signin_required")}</Link>
        </p>
      </div>
    );
  }

  const works = await fetchMyWorks(s.userId);

  return (
    <div className="stack">
      <div className="row-between">
        <h1 className="page-title" style={{ margin: 0 }}>{t(lang, "mw_title")}</h1>
        <Link href="/publish" className="btn btn-primary btn-sm">
          {t(lang, "nav_publish")}
        </Link>
      </div>

      {works.length === 0 ? (
        <div className="card">
          <p style={{ margin: 0 }}>{t(lang, "mw_empty")}</p>
          <p className="muted tiny" style={{ margin: "0.3rem 0 0" }}>
            {t(lang, "lib_empty_sub")}
          </p>
        </div>
      ) : (
        <div className="stack">
          {works.map((w) => (
            <article key={w.id} className="card stack" style={{ gap: "0.5rem" }}>
              <div className="row-between">
                <h2 style={{ fontSize: "1.05rem", margin: 0 }}>
                  <Link href={`/work/${w.id}`}>{w.title}</Link>
                </h2>
                <span className={STATUS_CLASS[w.status] ?? "pill"}>
                  {t(lang, STATUS_KEY[w.status] ?? "mw_status_draft")}
                </span>
              </div>

              <div className="work-meta">
                <span className="pill">{catLabel(lang, w.category)}</span>
                {typeof w.read_count === "number" && w.read_count > 0 && (
                  <span>{formatCount(lang, w.read_count, "read")}</span>
                )}
                {typeof w.avg_rating === "number" && w.rating_count && w.rating_count > 0 && (
                  <span>★ {w.avg_rating.toFixed(1)} ({w.rating_count})</span>
                )}
                <span className="muted">
                  {new Date(w.created_at).toLocaleDateString(lang === "ar" ? "ar-IQ" : "en-GB")}
                </span>
              </div>

              {w.status === "rejected" && w.rejection_reason && (
                <p className="status-note error-note" style={{ margin: 0 }}>
                  <strong>{t(lang, "mw_rejected_reason")}:</strong> {w.rejection_reason}
                </p>
              )}

              <MyWorkActions workId={w.id} lang={lang} />
            </article>
          ))}
        </div>
      )}
    </div>
  );
}