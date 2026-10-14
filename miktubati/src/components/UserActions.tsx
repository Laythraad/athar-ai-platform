"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { t, type Lang } from "@/lib/i18n";

type UserAction = "appoint_mod" | "remove_mod" | "suspend" | "unban" | "ban";

export default function UserActions({
  userId,
  role,
  accountStatus,
  isSelf,
  isProtected,
  callerIsAdmin,
  lang,
}: {
  userId: string;
  role: "member" | "moderator" | "admin";
  accountStatus: "active" | "suspended" | "banned";
  isSelf: boolean;
  isProtected: boolean;
  callerIsAdmin: boolean;
  lang: Lang;
}) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function act(action: UserAction) {
    if (action === "ban" && reason.trim().length < 3) {
      setErr(lang === "ar" ? "السبب مطلوب للحظر." : "A reason is required to ban.");
      return;
    }
    setBusy(true);
    setErr(null);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ userId, action, reason: reason.trim() }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        errorKey?: string;
      };
      if (res.ok && data.ok) {
        setMsg(
          action === "appoint_mod"
            ? (lang === "ar" ? "تمت الترقية إلى مشرف." : "Promoted to moderator.")
            : action === "remove_mod"
              ? (lang === "ar" ? "أُزيلت صفة المشرف." : "Moderator role removed.")
              : action === "suspend"
                ? (lang === "ar" ? "تم تعليق الحساب." : "Account suspended.")
                : action === "ban"
                  ? (lang === "ar" ? "تم حظر الحساب." : "Account banned.")
                  : (lang === "ar" ? "أُعيد تفعيل الحساب." : "Account reinstated."),
        );
        setReason("");
        router.refresh();
      } else if (data.errorKey === "cannot_act_on_self") {
        setErr(lang === "ar" ? "لا يمكنك تنفيذ هذا الإجراء على حسابك." : "You cannot do this to your own account.");
      } else if (data.errorKey === "user_protected") {
        setErr(lang === "ar" ? "هذا الحساب محمي." : "This account is protected.");
      } else if (data.errorKey === "forbidden") {
        setErr(t(lang, "common_error"));
      } else if (data.errorKey === "rate_limited") {
        setErr(lang === "ar" ? "إجراءات كثيرة — انتظر قليلاً." : "Too many actions — wait a moment.");
      } else {
        setErr(t(lang, "common_error"));
      }
    } catch {
      setErr(t(lang, "common_error"));
    } finally {
      setBusy(false);
    }
  }

  if (isSelf || isProtected) {
    return (
      <p className="tiny muted" style={{ margin: 0 }}>
        {isProtected
          ? (lang === "ar" ? "حساب محمي" : "Protected account")
          : (lang === "ar" ? "حسابك" : "Your account")}
      </p>
    );
  }

  return (
    <div className="stack" style={{ gap: "0.4rem" }}>
      <input
        className="input"
        value={reason}
        maxLength={500}
        onChange={(e) => setReason(e.target.value)}
        placeholder={lang === "ar" ? "سبب (مطلوب للحظر)" : "Reason (required to ban)"}
      />

      {err && (
        <p className="status-note error-note" style={{ margin: 0 }} role="alert">
          {err}
        </p>
      )}
      {msg && (
        <p className="status-note ok-note" style={{ margin: 0 }} role="status">
          {msg}
        </p>
      )}

      <div className="row" style={{ flexWrap: "wrap" }}>
        {callerIsAdmin && role !== "moderator" && role !== "admin" && (
          <button
            type="button"
            className="btn btn-primary btn-sm"
            disabled={busy}
            onClick={() => act("appoint_mod")}
          >
            {t(lang, "admin_appoint")}
          </button>
        )}
        {callerIsAdmin && role === "moderator" && (
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            disabled={busy}
            onClick={() => act("remove_mod")}
          >
            {t(lang, "admin_remove")}
          </button>
        )}
        {accountStatus === "active" && (
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            disabled={busy}
            onClick={() => act("suspend")}
          >
            {t(lang, "admin_suspend")}
          </button>
        )}
        {accountStatus !== "active" && (
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            disabled={busy}
            onClick={() => act("unban")}
          >
            {t(lang, "admin_unban")}
          </button>
        )}
        {callerIsAdmin && accountStatus !== "banned" && (
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            disabled={busy}
            onClick={() => act("ban")}
          >
            {t(lang, "admin_ban")}
          </button>
        )}
      </div>
    </div>
  );
}
