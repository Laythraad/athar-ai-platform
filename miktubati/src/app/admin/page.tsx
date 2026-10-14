import Link from "next/link";
import { getSession } from "@/lib/session";
import { isDbConfigured, readDbEnv } from "@/lib/env";
import { t } from "@/lib/i18n";
import { getCurrentLang } from "@/lib/lang";
import { isRoleAtLeast } from "@/lib/roles";
import { adminSupabase } from "@/lib/supabase/admin";
import AdminActions from "@/components/AdminActions";
import UserActions from "@/components/UserActions";
import ReportActions from "@/components/ReportActions";
import GuidelinesPublish from "@/components/GuidelinesPublish";

export const instant = false;

interface QueueRow {
  id: string;
  title: string;
  status: string;
  category: string;
  content: string | null;
  description: string | null;
  created_at: string;
  rejection_reason: string | null;
  profiles: { pen_name: string }[] | { pen_name: string } | null;
}

interface ReportRow {
  id: string;
  target_type: string;
  target_id: string;
  reason: string;
  status: string;
  created_at: string;
  works: { title: string }[] | { title: string } | null;
}

interface AuditRow {
  id: string;
  action: string;
  target_type: string | null;
  target_id: string | null;
  reason: string | null;
  created_at: string;
  actor_id: string;
  profiles: { pen_name: string }[] | { pen_name: string } | null;
}

interface UserRow {
  id: string;
  pen_name: string;
  account_status: string;
  created_at: string;
  user_roles: { role: string }[] | { role: string } | null;
}

function unwrap<T>(v: T[] | T | null): T | null {
  return Array.isArray(v) ? (v[0] ?? null) : v;
}

export default async function AdminPage() {
  const lang = await getCurrentLang();

  if (!isDbConfigured()) {
    return (
      <div className="panel">
        <div className="status-note">{t(lang, "common_offline_db")}</div>
      </div>
    );
  }

  const s = await getSession();
  if (!s.userId || !isRoleAtLeast(s.role, "moderator")) {
    return (
      <div className="panel card">
        <p style={{ margin: 0 }}>
          <Link href="/library">{lang === "ar" ? "غير مسموح." : "Not allowed."}</Link>
        </p>
      </div>
    );
  }

  const admin = adminSupabase();
  if (!admin) {
    return (
      <div className="panel">
        <div className="status-note">{lang === "ar" ? "مفتاح الخدمة غير مضبوط." : "Service role key not set."}</div>
      </div>
    );
  }

  const [queueRes, reportsRes, auditRes, statsRes, usersRes, guideRes] =
    await Promise.all([
      admin
        .from("works")
        .select(
          "id, title, status, category, content, description, created_at, rejection_reason, profiles(pen_name)",
        )
        .in("status", ["pending_review", "rejected"])
        .order("created_at", { ascending: false })
        .limit(50),
      admin
        .from("reports")
        .select("id, target_type, target_id, reason, status, created_at, works(title)")
        .eq("status", "open")
        .order("created_at", { ascending: false })
        .limit(50),
      admin
        .from("audit_log")
        .select("id, action, target_type, target_id, reason, created_at, actor_id, profiles(pen_name)")
        .order("created_at", { ascending: false })
        .limit(40),
      admin.from("works").select("id, status", { count: "exact", head: true }),
      admin
        .from("profiles")
        .select("id, pen_name, account_status, created_at, user_roles(role)")
        .order("created_at", { ascending: false })
        .limit(100),
      admin
        .from("guideline_versions")
        .select("version")
        .order("version", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

  const queue = (queueRes.data ?? []) as unknown as QueueRow[];
  const reports = (reportsRes.data ?? []) as unknown as ReportRow[];
  const audit = (auditRes.data ?? []) as unknown as AuditRow[];
  const users = (usersRes.data ?? []) as unknown as UserRow[];
  const currentGuidelineVersion =
    typeof guideRes.data?.version === "number" ? guideRes.data.version : 1;

  const pending = queue.filter((w) => w.status === "pending_review").length;
  const rejected = queue.filter((w) => w.status === "rejected").length;
  const protectedEmail = readDbEnv().adminEmail;

  // Resolve the ADMIN_EMAIL account's id so the UI marks it protected even
  // when it has no user_roles row yet. Best-effort; the API is authoritative.
  let protectedUserId: string | null = null;
  if (protectedEmail) {
    try {
      const { data: byEmail } = await admin.auth.admin.listUsers();
      const match = (byEmail?.users ?? []).find(
        (u) => u.email?.trim().toLowerCase() === protectedEmail,
      );
      protectedUserId = match?.id ?? null;
    } catch {
      protectedUserId = null;
    }
  }

  return (
    <div className="stack">
      <h1 className="page-title">{t(lang, "admin_title")}</h1>

      <div className="row">
        <span className="pill pill-pending">
          {lang === "ar" ? "قيد المراجعة" : "Pending"}: {pending}
        </span>
        <span className="pill pill-rejected">
          {lang === "ar" ? "مرفوض" : "Rejected"}: {rejected}
        </span>
        <span className="pill">
          {lang === "ar" ? "بلاغات مفتوحة" : "Open reports"}: {reports.length}
        </span>
        <span className="pill">
          {lang === "ar" ? "إجراءات" : "Audit entries"}: {audit.length}
        </span>
      </div>

      {/* ── moderation queue ─────────────────────────────────────────── */}
      <section className="stack">
        <h2 className="page-title" style={{ fontSize: "1.25rem" }}>
          {t(lang, "admin_queue")}
        </h2>

        {queue.length === 0 ? (
          <div className="card">
            <p style={{ margin: 0 }}>{t(lang, "admin_noqueue")}</p>
          </div>
        ) : (
          queue.map((w) => {
            const pen = unwrap(w.profiles)?.pen_name ?? "—";
            const preview = (w.content ?? w.description ?? "").replace(/\s+/g, " ").slice(0, 400);
            return (
              <article key={w.id} className="card stack" style={{ gap: "0.5rem" }}>
                <div className="row-between">
                  <h3 style={{ fontSize: "1.02rem", margin: 0 }}>{w.title}</h3>
                  <span className={`pill ${w.status === "rejected" ? "pill-rejected" : "pill-pending"}`}>
                    {t(lang, w.status === "rejected" ? "mw_status_rejected" : "mw_status_pending")}
                  </span>
                </div>

                <div className="work-meta">
                  <span>{pen}</span>
                  <span className="pill">{w.category}</span>
                  <span className="muted">
                    {new Date(w.created_at).toLocaleString(lang === "ar" ? "ar-IQ" : "en-GB")}
                  </span>
                </div>

                {preview && <p className="pre">{preview}</p>}

                <AdminActions workId={w.id} lang={lang} />
              </article>
            );
          })
        )}
      </section>

      {/* ── reports ──────────────────────────────────────────────────── */}
      <section className="stack">
        <h2 className="page-title" style={{ fontSize: "1.25rem" }}>
          {t(lang, "admin_reports")}
        </h2>

        {reports.length === 0 ? (
          <div className="card">
            <p style={{ margin: 0 }}>{t(lang, "admin_noreports")}</p>
          </div>
        ) : (
          <div className="card">
            <table className="table">
              <thead>
                <tr>
                  <th>{lang === "ar" ? "النوع" : "Type"}</th>
                  <th>{lang === "ar" ? "العمل" : "Work"}</th>
                  <th>{t(lang, "report_reason")}</th>
                  <th>{lang === "ar" ? "التاريخ" : "When"}</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((r) => (
                  <tr key={r.id}>
                    <td>{r.target_type}</td>
                    <td>
                      {r.target_type === "work" ? (
                        <Link href={`/work/${r.target_id}`}>{unwrap(r.works)?.title ?? r.target_id}</Link>
                      ) : (
                        <Link href={`/author/${r.target_id}`}>{r.target_id.slice(0, 8)}…</Link>
                      )}
                    </td>
                    <td>{r.reason}</td>
                    <td className="muted">{new Date(r.created_at).toLocaleString(lang === "ar" ? "ar-IQ" : "en-GB")}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {reports.map((r) => (
              <div key={`actions-${r.id}`} className="stack" style={{ marginTop: "0.75rem" }}>
                <p className="tiny muted" style={{ margin: 0 }}>
                  {r.target_type === "work" ? (
                    <Link href={`/work/${r.target_id}`}>{unwrap(r.works)?.title ?? r.target_id}</Link>
                  ) : (
                    r.target_id.slice(0, 8)
                  )}{" "}
                  — {r.reason}
                </p>
                <ReportActions reportId={r.id} lang={lang} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── users ─────────────────────────────────────────────────────── */}
      <section className="stack">
        <h2 className="page-title" style={{ fontSize: "1.25rem" }}>
          {t(lang, "admin_users")}
        </h2>
        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th>{lang === "ar" ? "القلم" : "Pen name"}</th>
                <th>{lang === "ar" ? "الدور" : "Role"}</th>
                <th>{lang === "ar" ? "الحالة" : "Status"}</th>
                <th>{lang === "ar" ? "إجراءات" : "Actions"}</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const role = (unwrap(u.user_roles)?.role ?? "member") as
                  | "member"
                  | "moderator"
                  | "admin";
                const status = u.account_status as "active" | "suspended" | "banned";
                const isSelf = u.id === s.userId;
                // The ADMIN_EMAIL account is untouchable, whether or not it
                // already has an admin role row. The API re-checks by email.
                const isProtected = isSelf || role === "admin" || u.id === protectedUserId;
                return (
                  <tr key={u.id}>
                    <td>
                      <Link href={`/author/${u.id}`}>{u.pen_name}</Link>
                      {protectedEmail && isProtected && (
                        <span className="tiny muted"> · {lang === "ar" ? "محمي" : "protected"}</span>
                      )}
                    </td>
                    <td>
                      <span className="pill">
                        {t(lang, role === "admin" ? "admin_role_admin" : role === "moderator" ? "admin_role_mod" : "admin_role_member")}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`pill ${status === "active" ? "" : status === "suspended" ? "pill-pending" : "pill-rejected"}`}
                      >
                        {status}
                      </span>
                    </td>
                    <td>
                      <UserActions
                        userId={u.id}
                        role={role}
                        accountStatus={status}
                        isSelf={isSelf}
                        isProtected={isProtected}
                        callerIsAdmin={s.role === "admin"}
                        lang={lang}
                      />
                    </td>
                  </tr>
                );
              })}
              {users.length === 0 && (
                <tr>
                  <td colSpan={4} className="muted">
                    {lang === "ar" ? "لا حسابات بعد." : "No accounts yet."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── guidelines ────────────────────────────────────────────────── */}
      <section className="stack">
        <h2 className="page-title" style={{ fontSize: "1.25rem" }}>
          {t(lang, "admin_guidelines")}
        </h2>
        <GuidelinesPublish currentVersion={currentGuidelineVersion} lang={lang} />
      </section>

      {/* ── audit log ────────────────────────────────────────────────── */}
      <section className="stack">
        <h2 className="page-title" style={{ fontSize: "1.25rem" }}>
          {t(lang, "admin_audit")}
        </h2>
        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th>{lang === "ar" ? "الفعل" : "Action"}</th>
                <th>{lang === "ar" ? "المنفّذ" : "Actor"}</th>
                <th>{lang === "ar" ? "الهدف" : "Target"}</th>
                <th>{t(lang, "admin_reason")}</th>
                <th>{lang === "ar" ? "التاريخ" : "When"}</th>
              </tr>
            </thead>
            <tbody>
              {audit.map((a) => (
                <tr key={a.id}>
                  <td><code>{a.action}</code></td>
                  <td>{unwrap(a.profiles)?.pen_name ?? a.actor_id.slice(0, 8)}</td>
                  <td className="muted">
                    {a.target_type}
                    {a.target_id ? `:${a.target_id.slice(0, 8)}` : ""}
                  </td>
                  <td>{a.reason ?? "—"}</td>
                  <td className="muted">{new Date(a.created_at).toLocaleString(lang === "ar" ? "ar-IQ" : "en-GB")}</td>
                </tr>
              ))}
              {audit.length === 0 && (
                <tr>
                  <td colSpan={5} className="muted">
                    {lang === "ar" ? "لا سجل بعد." : "No entries yet."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {statsRes.count !== null && (
        <p className="tiny muted" style={{ margin: 0 }}>
          {lang === "ar" ? "إجمالي الأعمال" : "Total works"}: {statsRes.count}
        </p>
      )}
    </div>
  );
}