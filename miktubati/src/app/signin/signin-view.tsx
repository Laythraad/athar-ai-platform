"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { browserSupabase } from "@/lib/supabase/client";
import { t, authErrorKey, type Lang } from "@/lib/i18n";
import { useLang } from "@/lib/useLang";

function SigninForm({ lang }: { lang: Lang }) {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") ?? "/library";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    const sb = browserSupabase();
    if (!sb) {
      setErr(t(lang, "common_offline_db"));
      return;
    }
    setBusy(true);
    setErr(null);
    setInfo(null);

    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) {
      setErr(t(lang, authErrorKey(error.message)));
      setBusy(false);
      return;
    }
    if (!data.user?.email_confirmed_at) {
      setInfo(t(lang, "auth_email_unverified"));
      setBusy(false);
      router.push("/verify");
      return;
    }
    router.push(next);
    router.refresh();
  }

  async function google() {
    const sb = browserSupabase();
    if (!sb) {
      setErr(t(lang, "common_offline_db"));
      return;
    }
    setBusy(true);
    const origin = window.location.origin;
    const { error } = await sb.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}` },
    });
    if (error) {
      setErr(t(lang, authErrorKey(error.message)));
      setBusy(false);
    }
  }

  return (
    <form className="form" onSubmit={signIn}>
      {/* Google is the primary way in — no password to store or leak. */}
      <button className="btn btn-primary" type="button" onClick={google} disabled={busy} style={{ width: "100%" }}>
        {t(lang, "auth_google")}
      </button>

      <div className="divider">{lang === "ar" ? "أو بالبريد" : "or with email"}</div>

      <label className="field">
        {t(lang, "auth_email")}
        <input
          className="input"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </label>
      <label className="field">
        {t(lang, "auth_password")}
        <input
          className="input"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </label>

      {err && (
        <p className="status-note error-note" style={{ margin: 0 }} role="alert">
          {err}
        </p>
      )}
      {info && (
        <p className="status-note" style={{ margin: 0 }} role="status">
          {info}
        </p>
      )}

      <button className="btn btn-ghost" type="submit" disabled={busy}>
        {busy ? t(lang, "auth_checking") : t(lang, "auth_signin")}
      </button>

      <p className="tiny muted" style={{ margin: 0, textAlign: "center" }}>
        {t(lang, "auth_no_account")} <Link href="/signup">{t(lang, "auth_signup")}</Link>
      </p>
    </form>
  );
}

export default function SigninView({ initialLang }: { initialLang: Lang }) {
  const lang = useLang(initialLang);
  return (
    <div className="panel card">
      <h1 className="page-title">{t(lang, "auth_signin")}</h1>
      <Suspense fallback={<p className="muted">{t(lang, "common_loading")}</p>}>
        <SigninForm lang={lang} />
      </Suspense>
    </div>
  );
}
