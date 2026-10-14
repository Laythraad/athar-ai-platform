import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchAuthor, fetchAuthorWorks, fetchAuthorRating } from "@/lib/queries";
import { getSession } from "@/lib/session";
import { isDbConfigured } from "@/lib/env";
import { t, formatCount } from "@/lib/i18n";
import { getCurrentLang } from "@/lib/lang";
import WorkCard from "@/components/WorkCard";
import Stars from "@/components/Stars";

export const instant = false;

const TYPE_KEY: Record<string, string> = {
  writer: "author_type_writer",
  poet: "author_type_poet",
  historian: "author_type_historian",
};

export default async function AuthorPage({ params }: { params: Promise<{ id: string }> }) {
  const lang = await getCurrentLang();
  const { id } = await params;

  if (!isDbConfigured()) {
    return (
      <div className="panel">
        <div className="status-note">{t(lang, "common_offline_db")}</div>
      </div>
    );
  }

  const author = await fetchAuthor(id);
  if (!author || author.account_status === "banned") notFound();

  const [works, rating, session] = await Promise.all([
    fetchAuthorWorks(id),
    fetchAuthorRating(id),
    getSession(),
  ]);

  const signedIn = Boolean(session.userId) && session.stage === "member" && !session.isBlocked;
  const isSelf = session.userId === id;

  const totalReads = works.reduce((sum, w) => sum + (w.read_count ?? 0), 0);
  const topWork = works.reduce<typeof works[number] | null>(
    (best, w) => (!best || (w.read_count ?? 0) > (best.read_count ?? 0) ? w : best),
    null,
  );

  return (
    <div className="stack">
      <header className="card stack">
        <div className="row-between">
          <div>
            <h1 className="page-title" style={{ marginBottom: "0.2rem" }}>
              {author.pen_name}
            </h1>
            <p className="tiny muted" style={{ margin: 0 }}>
              {t(lang, TYPE_KEY[author.author_type] ?? "author_type_writer")} ·{" "}
              {t(lang, "author_joined")}{" "}
              {new Date(author.created_at).toLocaleDateString(lang === "ar" ? "ar-IQ" : "en-GB")}
            </p>
          </div>
          {rating.count > 0 && (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "1.8rem", fontFamily: "var(--f-display)" }}>
                ★ {rating.avg.toFixed(1)}
              </div>
              <div className="tiny muted">
                {rating.count} {lang === "ar" ? "تقييم" : "ratings"}
              </div>
            </div>
          )}
        </div>

        {author.bio && <p style={{ margin: 0 }}>{author.bio}</p>}

        <div className="author-stats">
          <div className="stat">
            <span className="stat-num">{works.length}</span>
            <span className="stat-lbl">{formatCount(lang, works.length, "work")}</span>
          </div>
          <div className="stat">
            <span className="stat-num">{totalReads}</span>
            <span className="stat-lbl">{formatCount(lang, totalReads, "read")}</span>
          </div>
          {rating.count > 0 && (
            <div className="stat">
              <span className="stat-num">★ {rating.avg.toFixed(1)}</span>
              <span className="stat-lbl">
                {rating.count} {lang === "ar" ? "تقييم" : "ratings"}
              </span>
            </div>
          )}
          {topWork && (
            <div className="stat" style={{ flex: "1 1 200px", textAlign: "start" }}>
              <span className="stat-lbl">{lang === "ar" ? "الأكثر قراءة" : "Most read"}</span>
              <Link href={`/work/${topWork.id}`} className="stat-num" style={{ fontSize: "1rem" }}>
                {topWork.title}
              </Link>
            </div>
          )}
        </div>

        <div>
          <p className="tiny muted" style={{ margin: "0 0 0.25rem" }}>
            {t(lang, "author_rate")}
          </p>
          {isSelf ? (
            <p className="muted tiny" style={{ margin: 0 }}>
              {t(lang, "author_rate_own")}
            </p>
          ) : signedIn ? (
            <Stars
              authorId={id}
              mine={rating.mine}
              canRate
              labels={{
                rate: t(lang, "author_rate"),
                own: t(lang, "author_rate_own"),
                saved: lang === "ar" ? "حُفظ تقييمك" : "Rating saved",
                error: t(lang, "common_error"),
              }}
            />
          ) : (
            <p className="muted tiny" style={{ margin: 0 }}>
              <Link href="/signin">{t(lang, "auth_signin_required")}</Link>
            </p>
          )}
        </div>
      </header>

      <section>
        <h2 className="page-title" style={{ fontSize: "1.3rem" }}>
          {t(lang, "author_works")}
        </h2>
        {works.length === 0 ? (
          <p className="muted">{t(lang, "lib_empty")}</p>
        ) : (
          <div className="grid-cards">
            {works.map((w) => (
              <WorkCard key={w.id} work={w} lang={lang} penName={author.pen_name} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}