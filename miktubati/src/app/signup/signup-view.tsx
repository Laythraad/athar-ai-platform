"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { browserSupabase } from "@/lib/supabase/client";
import { t, authErrorKey, type Lang } from "@/lib/i18n";
import { useLang } from "@/lib/useLang";

export default function SignupView({ initialLang }: { initialLang: Lang }) {
  const lang = useLang(initialLang);
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function signUp(e: React.FormEvent) {
    e.preventDefault();
    const sb = browserSupabase();
    if (!sb) {
      setErr(t(lang, "common_offline_db"));
      return;
    }
    setBusy(true);
    setErr(null);

    const origin = window.location.origin;
    const { data, error } = await sb.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${origin}/auth/callback` },
    });

    if (error) {
      setErr(t(lang, authErrorKey(error.message)));
      setBusy(false);
      return;
    }

    // If the project has confirmations ON, no session is returned yet.
    if (!data.session) {
      setDone(true);
      setBusy(false);
      return;
    }

    router.push("/onboarding");
    router.refresh();
  }

  async function google() {
    const sb = browserSupabase();
    if (!sb) {
      setErr(t(lang, "common_offline_db"));
      return;
    }
    setBusy(true);
    setErr(null);
    const origin = window.location.origin;
    const { error } = await sb.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${origin}/auth/callback?next=${encodeURIComponent("/onboarding")}` },
    });
    if (error) {
      setErr(t(lang, authErrorKey(error.message)));
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="panel card stack">
        <h1 className="page-title">{t(lang, "auth_verify_title")}</h1>
        <p className="muted">{t(lang, "auth_verify_body")}</p>
        <p style={{ margin: 0 }}>
          <Link href="/verify" className="btn btn-primary btn-sm">
            {t(lang, "auth_verify_title")}
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="panel card">
      <h1 className="page-title">{t(lang, "auth_signup")}</h1>
      <form className="form" onSubmit={signUp}>
        {/* Registration is Google-first — no password to create or store. */}
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
            autoComplete="new-password"
            minLength={8}
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

        <button className="btn btn-ghost" type="submit" disabled={busy}>
          {busy ? t(lang, "auth_checking") : t(lang, "auth_signup")}
        </button>

        <p className="tiny muted" style={{ margin: 0, textAlign: "center" }}>
          {t(lang, "auth_have_account")} <Link href="/signin">{t(lang, "auth_signin")}</Link>
        </p>
      </form>
    </div>
  );
}
