"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { browserSupabase } from "@/lib/supabase/client";
import { t, authErrorKey, type Lang } from "@/lib/i18n";
import { useLang } from "@/lib/useLang";

export default function VerifyView({ initialLang }: { initialLang: Lang }) {
  const lang = useLang(initialLang);
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);

  async function refresh() {
    const sb = browserSupabase();
    if (!sb) return;
    const { data } = await sb.auth.getUser();
    if (data.user?.email_confirmed_at) {
      router.push("/onboarding");
      router.refresh();
    }
  }

  useEffect(() => {
    void refresh().finally(() => setChecked(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function resend() {
    const sb = browserSupabase();
    if (!sb) return;
    setBusy(true);
    setMsg(null);
    const { data } = await sb.auth.getSession();
    const email = data.session?.user.email;
    if (!email) {
      setMsg(t(lang, "auth_signin_required"));
      setBusy(false);
      return;
    }
    const origin = window.location.origin;
    const { error } = await sb.auth.resend({ type: "signup", email, options: { emailRedirectTo: `${origin}/auth/callback` } });
    setMsg(error ? t(lang, authErrorKey(error.message)) : (lang === "ar" ? "أُعيد الإرسال." : "Sent again."));
    setBusy(false);
  }

  return (
    <div className="panel card stack">
      <h1 className="page-title">{t(lang, "auth_verify_title")}</h1>
      <p className="muted">{t(lang, "auth_verify_body")}</p>

      {checked && (
        <p className="tiny muted" style={{ margin: 0 }}>
          {lang === "ar"
            ? "بعد تأكيد البريد، عُد إلى هذه الصفحة أو أعد تحميلها."
            : "After confirming, come back to this page or reload it."}
        </p>
      )}

      {msg && (
        <p className="status-note" style={{ margin: 0 }} role="status">
          {msg}
        </p>
      )}

      <div className="row">
        <button className="btn btn-primary btn-sm" onClick={refresh}>
          {lang === "ar" ? "لقد أكّدت — تابع" : "I have confirmed — continue"}
        </button>
        <button className="btn btn-ghost btn-sm" onClick={resend} disabled={busy}>
          {t(lang, "auth_verify_resend")}
        </button>
      </div>
    </div>
  );
}
