"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { t, type Lang } from "@/lib/i18n";

export default function ReportActions({
  reportId,
  lang,
}: {
  reportId: string;
  lang: Lang;
}) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function act(action: "resolve" | "dismiss") {
    setBusy(true);
    setErr(null);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/reports", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ reportId, action, reason: reason.trim() }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        errorKey?: string;
      };
      if (res.ok && data.ok) {
        setMsg(
          action === "resolve"
            ? (lang === "ar" ? "أُغلق البلاغ — تم اتخاذ إجراء." : "Report resolved — action taken.")
            : (lang === "ar" ? "أُغلق البلاغ — لا مخالفة." : "Report dismissed — no violation."),
        );
        setReason("");
        router.refresh();
      } else if (data.errorKey === "already_resolved") {
        setErr(lang === "ar" ? "هذا البلاغ مغلق بالفعل." : "This report is already closed.");
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

  return (
    <div className="stack" style={{ gap: "0.4rem", marginTop: "0.5rem" }}>
      <input
        className="input"
        value={reason}
        maxLength={500}
        onChange={(e) => setReason(e.target.value)}
        placeholder={lang === "ar" ? "ملاحظة الإغلاق" : "Closing note"}
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
      <div className="row">
        <button
          type="button"
          className="btn btn-primary btn-sm"
          disabled={busy}
          onClick={() => act("resolve")}
        >
          {lang === "ar" ? "اتُّخذ الإجراء" : "Resolve (acted)"}
        </button>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          disabled={busy}
          onClick={() => act("dismiss")}
        >
          {lang === "ar" ? "لا مخالفة" : "Dismiss"}
        </button>
      </div>
    </div>
  );
}
