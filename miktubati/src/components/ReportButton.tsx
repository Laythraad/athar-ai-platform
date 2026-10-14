"use client";

import { useState } from "react";
import { t, type Lang } from "@/lib/i18n";

export default function ReportButton({ workId, lang }: { workId: string; lang: Lang }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit() {
    if (!reason.trim() || busy) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ targetType: "work", targetId: workId, reason: reason.trim() }),
      });
      if (res.ok) {
        setDone(true);
        setOpen(false);
      } else {
        const d = (await res.json().catch(() => ({}))) as { errorKey?: string };
        setErr(d.errorKey === "auth_required" ? t(lang, "auth_signin_required") : t(lang, "common_error"));
      }
    } catch {
      setErr(t(lang, "common_error"));
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <p className="status-note ok-note" style={{ margin: 0 }}>
        {t(lang, "report_done")}
      </p>
    );
  }

  if (!open) {
    return (
      <button type="button" className="btn btn-ghost btn-sm" onClick={() => setOpen(true)}>
        ⚑ {t(lang, "work_report")}
      </button>
    );
  }

  return (
    <div className="card stack" style={{ width: "100%" }}>
      <label className="field">
        {t(lang, "report_reason")}
        <textarea
          className="textarea"
          rows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </label>
      {err && (
        <p className="status-note error-note" style={{ margin: 0 }}>
          {err}
        </p>
      )}
      <div className="row">
        <button type="button" className="btn btn-primary btn-sm" onClick={submit} disabled={busy || !reason.trim()}>
          {t(lang, "report_submit")}
        </button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setOpen(false)}>
          {t(lang, "common_cancel")}
        </button>
      </div>
    </div>
  );
}
