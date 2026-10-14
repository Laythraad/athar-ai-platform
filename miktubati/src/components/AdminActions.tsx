"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { t, type Lang } from "@/lib/i18n";

export default function AdminActions({ workId, lang }: { workId: string; lang: Lang }) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function decide(action: "approve" | "reject") {
    if (action === "reject" && reason.trim().length < 3) {
      setErr(lang === "ar" ? "السبب مطلوب للرفض." : "A reason is required to reject.");
      return;
    }
    setBusy(true);
    setErr(null);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/works", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ workId, action, reason: reason.trim() }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; errorKey?: string };
      if (res.ok && data.ok) {
        setMsg(
          action === "approve"
            ? (lang === "ar" ? "نُشر العمل." : "Work published.")
            : (lang === "ar" ? "رُفض العمل." : "Work rejected."),
        );
        setReason("");
        router.refresh();
      } else {
        setErr(
          data.errorKey === "rate_limited"
            ? (lang === "ar" ? "إجراءات كثيرة — انتظر قليلاً." : "Too many actions — wait a moment.")
            : t(lang, "common_error"),
        );
      }
    } catch {
      setErr(t(lang, "common_error"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="stack" style={{ gap: "0.45rem" }}>
      <label className="field">
        {t(lang, "admin_reason")}
        <input
          className="input"
          value={reason}
          maxLength={500}
          onChange={(e) => setReason(e.target.value)}
          placeholder={lang === "ar" ? "سبب الرفض أو الملاحظة" : "Rejection reason or note"}
        />
      </label>

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

      <div className="row">
        <button type="button" className="btn btn-primary btn-sm" disabled={busy} onClick={() => decide("approve")}>
          {t(lang, "admin_approve")}
        </button>
        <button type="button" className="btn btn-ghost btn-sm" disabled={busy} onClick={() => decide("reject")}>
          {t(lang, "admin_reject")}
        </button>
      </div>
    </div>
  );
}
