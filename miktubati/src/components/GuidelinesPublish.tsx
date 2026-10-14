"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { t, type Lang } from "@/lib/i18n";

/* Admin-only form to publish a NEW immutable guideline version.
   Existing acceptances are never migrated — everyone is routed back
   through /onboarding to accept the new version. */

export default function GuidelinesPublish({
  currentVersion,
  lang,
}: {
  currentVersion: number;
  lang: Lang;
}) {
  const router = useRouter();
  const [contentAr, setContentAr] = useState("");
  const [contentEn, setContentEn] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function publish() {
    if (contentAr.trim().length < 50 || contentEn.trim().length < 50) {
      setErr(
        lang === "ar"
          ? "النص مطلوب بالعربية والإنجليزية (50 حرفاً على الأقل لكل منهما)."
          : "Both the Arabic and English text are required (50+ characters each).",
      );
      return;
    }
    setBusy(true);
    setErr(null);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/guidelines", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ contentAr: contentAr.trim(), contentEn: contentEn.trim() }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        version?: number;
        errorKey?: string;
      };
      if (res.ok && data.ok) {
        setMsg(
          lang === "ar"
            ? `نُشر الإصدار ${data.version}. سيعيد النظام الجميع إلى شاشة القبول.`
            : `Version ${data.version} published. Everyone will be asked to re-accept.`,
        );
        setContentAr("");
        setContentEn("");
        router.refresh();
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
    <div className="card stack" style={{ gap: "0.6rem" }}>
      <p className="tiny muted" style={{ margin: 0 }}>
        {lang === "ar"
          ? `الإصدار الحالي: ${currentVersion}. النشر ينشئ إصداراً جديداً ولا يعدّل القديم.`
          : `Current version: ${currentVersion}. Publishing creates a new version; the old one is kept.`}
      </p>

      <label className="field">
        {lang === "ar" ? "النص بالعربية" : "Arabic text"}
        <textarea
          className="textarea"
          rows={8}
          value={contentAr}
          maxLength={20_000}
          onChange={(e) => setContentAr(e.target.value)}
          placeholder={lang === "ar" ? "نص الميثاق بالعربية…" : "Guidelines text in Arabic…"}
        />
      </label>

      <label className="field">
        {lang === "ar" ? "النص بالإنجليزية" : "English text"}
        <textarea
          className="textarea"
          rows={8}
          value={contentEn}
          maxLength={20_000}
          onChange={(e) => setContentEn(e.target.value)}
          placeholder={lang === "ar" ? "نص الميثاق بالإنجليزية…" : "Guidelines text in English…"}
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
        <button type="button" className="btn btn-primary btn-sm" disabled={busy} onClick={publish}>
          {busy ? t(lang, "common_loading") : t(lang, "admin_new_version")}
        </button>
      </div>
    </div>
  );
}
