import Link from "next/link";
import type { WorkRow } from "@/lib/queries";
import { t, catLabel, formatCount, type Lang } from "@/lib/i18n";

function excerpt(w: WorkRow): string | null {
  if (w.description) return w.description;
  if (w.content) {
    const clean = w.content.replace(/\s+/g, " ").trim();
    return clean.length > 150 ? `${clean.slice(0, 150)}…` : clean;
  }
  return null;
}

/** Presentational card for a published work. */
export default function WorkCard({
  work,
  lang,
  penName,
}: {
  work: WorkRow;
  lang: Lang;
  penName?: string | null;
}) {
  const author = penName ?? work.pen_name ?? null;
  const avg = typeof work.avg_rating === "number" ? work.avg_rating : 0;
  const count = typeof work.rating_count === "number" ? work.rating_count : 0;
  const reads = typeof work.read_count === "number" ? work.read_count : 0;
  const ex = excerpt(work);

  return (
    <article className="card work-card">
      <div className="row-between">
        <span className="pill">{catLabel(lang, work.category)}</span>
        <span className="row" style={{ gap: "0.35rem" }}>
          {work.is_sample && (
            <span className="pill pill-pending" title={t(lang, "lib_sample")}>
              {t(lang, "lib_sample")}
            </span>
          )}
          <span className="pill" title={t(lang, "lib_unverified")}>
            {t(lang, "lib_unverified")}
          </span>
        </span>
      </div>

      <h3 className="work-title">
        <Link href={`/work/${work.id}`} style={{ textDecoration: "none" }}>
          {work.title}
        </Link>
      </h3>

      {author && (
        <p className="work-meta" style={{ margin: 0 }}>
          <span>
            {t(lang, "lib_by")}{" "}
            <Link href={`/author/${work.author_id}`}>{author}</Link>
          </span>
        </p>
      )}

      {ex && <p className="work-excerpt">{ex}</p>}

      <div className="work-meta">
        {count > 0 ? (
          <span aria-label={`${avg} of 5, ${count} ratings`}>
            ★ {avg.toFixed(1)} ({count})
          </span>
        ) : (
          <span className="muted">{lang === "ar" ? "لا تقييمات بعد" : "No ratings yet"}</span>
        )}
        {reads > 0 && <span>{formatCount(lang, reads, "read")}</span>}
      </div>
    </article>
  );
}
