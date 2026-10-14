import Link from "next/link";
import { getSession } from "@/lib/session";
import { fetchReadingList } from "@/lib/queries";
import { isDbConfigured } from "@/lib/env";
import { t, catLabel } from "@/lib/i18n";
import { getCurrentLang } from "@/lib/lang";
import ReadingControls from "@/components/ReadingControls";

export const instant = false;

const TABS = [
  { key: "all", label: "lib_all" },
  { key: "favorite", label: "my_fav" },
  { key: "reading", label: "my_reading" },
  { key: "want_to_read", label: "my_want" },
  { key: "finished", label: "my_finished" },
] as const;

export default async function MyLibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const lang = await getCurrentLang();
  const { tab } = await searchParams;
  const active = TABS.some((x) => x.key === tab) ? (tab as string) : "all";

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
          <Link href="/signin?next=/my">{t(lang, "auth_signin_required")}</Link>
        </p>
      </div>
    );
  }

  const all = await fetchReadingList(s.userId);
  const rows = active === "all" ? all : all.filter((r) => r.status === active);

  return (
    <div className="stack">
      <h1 className="page-title">{t(lang, "my_title")}</h1>

      <nav className="row" aria-label={t(lang, "my_title")}>
        {TABS.map((x) => (
          <Link
            key={x.key}
            href={x.key === "all" ? "/my" : `/my?tab=${x.key}`}
            className={`chip${active === x.key ? " on" : ""}`}
          >
            {t(lang, x.label)}
          </Link>
        ))}
      </nav>

      {rows.length === 0 ? (
        <div className="card">
          <p style={{ margin: 0 }}>{t(lang, "my_empty")}</p>
          <p className="muted tiny" style={{ margin: "0.3rem 0 0" }}>
            <Link href="/library">{t(lang, "home_cta_browse")}</Link>
          </p>
        </div>
      ) : (
        <div className="stack">
          {rows.map((r) => {
            const w = r.work;
            if (!w) return null;
            const avg = typeof w.avg_rating === "number" ? w.avg_rating : 0;
            const count = typeof w.rating_count === "number" ? w.rating_count : 0;
            return (
              <article key={r.work_id} className="card stack" style={{ gap: "0.4rem" }}>
                <div className="row-between">
                  <h2 style={{ fontSize: "1.05rem", margin: 0 }}>
                    <Link href={`/work/${w.id}`}>{w.title}</Link>
                  </h2>
                  <span className="pill">{t(lang, STATUS_LABEL[r.status] ?? "my_want")}</span>
                </div>
                <div className="work-meta">
                  <span className="pill">{catLabel(lang, w.category)}</span>
                  {count > 0 && <span>★ {avg.toFixed(1)} ({count})</span>}
                </div>
                <ReadingControls workId={r.work_id} current={r.status} lang={lang} />
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

const STATUS_LABEL: Record<string, string> = {
  favorite: "my_fav",
  reading: "my_reading",
  want_to_read: "my_want",
  finished: "my_finished",
};