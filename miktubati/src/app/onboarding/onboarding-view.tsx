"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { browserSupabase } from "@/lib/supabase/client";
import GuidelinesBody from "@/components/GuidelinesBody";
import { t, type Lang } from "@/lib/i18n";
import { useLang } from "@/lib/useLang";

/* Onboarding — the first thing a new member sees after signing in with Google.
   Flow:  Welcome/mission → Features → Rules (accept) → Identity → Interests → Done
   The mission step explains what مكتبتي is and why it matters for Iraq,
   tourism and culture — this is intentional, not decoration. */

const TOTAL_STEPS = 6;

type Stage =
  | "loading"
  | "needs_verify"
  | "step_welcome"
  | "step_features"
  | "step_rules"
  | "step_identity"
  | "step_interests"
  | "ready"
  | "unconfigured";

const FEATURES = ["ob_f_read", "ob_f_write", "ob_f_rate", "ob_f_shelf", "ob_f_safe", "ob_f_lang"] as const;

const INTEREST_SLUGS = [
  "space", "science", "history", "literature", "philosophy", "art", "music",
  "cuisine", "architecture", "nature", "travel", "tech", "math", "medicine",
  "physics", "religion", "photography", "gaming", "sports", "economics",
] as const;

export default function OnboardingView({
  initialLang,
  latestVersion,
}: {
  initialLang: Lang;
  latestVersion?: number;
}) {
  const lang = useLang(initialLang);
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("loading");
  const [accepted, setAccepted] = useState(false);
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [interests, setInterests] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function toggleInterest(slug: string) {
    setInterests((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  }

  useEffect(() => {
    // Auth bootstrap: every setState happens in an async callback, never
    // synchronously inside the effect body.
    void (async () => {
      const sb = browserSupabase();
      if (!sb) {
        await Promise.resolve();
        setStage("unconfigured");
        return;
      }
      const { data } = await sb.auth.getUser();
      const u = data.user;
      if (!u) {
        router.replace("/signin?next=/onboarding");
        return;
      }
      // Google OAuth emails are pre-verified; password accounts may not be.
      if (!u.email_confirmed_at) {
        setStage("needs_verify");
        return;
      }
      setStage("step_welcome");
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const nameParts = fullName.trim().split(/\s+/).filter(Boolean).length;
  const usernameOk = /^[a-z][a-z0-9_.]{2,23}$/.test(username.trim().toLowerCase());
  const identityReady = nameParts >= 3 && usernameOk;

  async function finish() {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          acceptGuidelines: true,
          fullName: fullName.trim(),
          username: username.trim().toLowerCase(),
          bio,
          interests: Array.from(interests),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        errorKey?: string;
      };
      if (res.ok && data.ok) {
        setStage("ready");
        setTimeout(() => {
          router.push("/library");
          router.refresh();
        }, 700);
      } else {
        const key = data.errorKey ?? "";
        setErr(
          key === "username_taken"
            ? t(lang, "ob_username_taken")
            : key === "username_invalid"
              ? t(lang, "ob_username_invalid")
              : key === "fullname_incomplete"
                ? t(lang, "ob_fullname_incomplete")
                : key === "fullname_invalid"
                  ? t(lang, "ob_fullname_invalid")
                  : key === "identity_rejected"
                    ? t(lang, "ob_identity_rejected")
                    : t(lang, "common_error"),
        );
      }
    } catch {
      setErr(t(lang, "common_error"));
    } finally {
      setBusy(false);
    }
  }

  if (stage === "unconfigured") {
    return (
      <div className="panel card">
        <div className="status-note">{t(lang, "common_offline_db")}</div>
      </div>
    );
  }

  if (stage === "loading") {
    return <p className="muted">{t(lang, "common_loading")}</p>;
  }

  if (stage === "needs_verify") {
    return (
      <div className="panel card stack">
        <h1 className="page-title">{t(lang, "auth_verify_title")}</h1>
        <p className="muted">{t(lang, "auth_verify_body")}</p>
        <p style={{ margin: 0 }}>
          <a href="/verify" className="btn btn-primary btn-sm">
            {t(lang, "auth_verify_title")}
          </a>
        </p>
      </div>
    );
  }

  if (stage === "ready") {
    return (
      <div className="panel card">
        <p className="status-note ok-note">{t(lang, "ob_done")}</p>
      </div>
    );
  }

  const step =
    stage === "step_welcome"
      ? 1
      : stage === "step_features"
        ? 2
        : stage === "step_rules"
          ? 3
          : stage === "step_identity"
            ? 4
            : stage === "step_interests"
              ? 5
              : 6;

  return (
    <div className="panel-wide">
      <div className="steps" aria-hidden="true">
        {Array.from({ length: TOTAL_STEPS }, (_, i) => (
          <span key={i} className={`step-dot${i < step ? " on" : ""}`} />
        ))}
      </div>
      <p className="tiny muted">{t(lang, "ob_step", { n: step, total: TOTAL_STEPS })}</p>

      {stage === "step_welcome" && (
        <div className="card stack">
          <h1 className="page-title">{t(lang, "ob_welcome_title")}</h1>
          <p className="muted">{t(lang, "ob_welcome_body")}</p>
          <h2 style={{ fontSize: "1.1rem", margin: 0 }}>{t(lang, "ob_why_title")}</h2>
          <p style={{ margin: 0 }}>{t(lang, "ob_why_body")}</p>
          <div className="row">
            <button className="btn btn-primary" onClick={() => setStage("step_features")}>
              {t(lang, "common_next")}
            </button>
          </div>
        </div>
      )}

      {stage === "step_features" && (
        <div className="card stack">
          <h1 className="page-title">{t(lang, "ob_features_title")}</h1>
          <ul className="stack" style={{ margin: 0, paddingInlineStart: "1.1rem" }}>
            {FEATURES.map((k) => (
              <li key={k}>{t(lang, k)}</li>
            ))}
          </ul>
          <div className="row">
            <button className="btn btn-primary" onClick={() => setStage("step_rules")}>
              {t(lang, "common_next")}
            </button>
            <button className="btn btn-ghost" onClick={() => setStage("step_welcome")}>
              {t(lang, "common_back")}
            </button>
          </div>
        </div>
      )}

      {stage === "step_rules" && (
        <div className="card stack">
          <h1 className="page-title">{t(lang, "ob_guidelines")}</h1>
          <p className="muted">{t(lang, "ob_guidelines_body")}</p>
          <GuidelinesBody lang={lang} />
          <label className="row" style={{ cursor: "pointer" }}>
            <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} />
            <span>{t(lang, "ob_accept")}</span>
          </label>
          <p className="tiny muted" style={{ margin: 0 }}>
            {t(lang, "ob_accept_version", { v: latestVersion ?? 1 })}
          </p>
          <div className="row">
            <button
              className="btn btn-primary"
              disabled={!accepted}
              onClick={() => setStage("step_identity")}
            >
              {t(lang, "common_next")}
            </button>
            <button className="btn btn-ghost" onClick={() => setStage("step_features")}>
              {t(lang, "common_back")}
            </button>
          </div>
        </div>
      )}

      {stage === "step_identity" && (
        <div className="card stack">
          <h1 className="page-title">{t(lang, "ob_identity_title")}</h1>
          <p className="muted">{t(lang, "ob_identity_body")}</p>

          <label className="field">
            {t(lang, "ob_fullname")}
            <input
              className="input"
              value={fullName}
              maxLength={120}
              placeholder={t(lang, "ob_fullname_ph")}
              onChange={(e) => setFullName(e.target.value)}
            />
            <span className="tiny muted">{t(lang, "ob_fullname_hint")}</span>
          </label>

          <label className="field">
            {t(lang, "ob_username")}
            <input
              className="input"
              value={username}
              maxLength={24}
              placeholder={t(lang, "ob_username_ph")}
              onChange={(e) => setUsername(e.target.value.toLowerCase())}
            />
            <span className="tiny muted">{t(lang, "ob_username_hint")}</span>
          </label>

          <label className="field">
            {t(lang, "ob_bio")}
            <textarea
              className="textarea"
              rows={3}
              maxLength={500}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />
          </label>

          {err && (
            <p className="status-note error-note" style={{ margin: 0 }} role="alert">
              {err}
            </p>
          )}

          <div className="row">
            <button
              className="btn btn-primary"
              disabled={!identityReady || busy}
              onClick={() => setStage("step_interests")}
            >
              {t(lang, "common_next")}
            </button>
            <button className="btn btn-ghost" onClick={() => setStage("step_rules")} disabled={busy}>
              {t(lang, "common_back")}
            </button>
          </div>
        </div>
      )}

      {stage === "step_interests" && (
        <div className="card stack">
          <h1 className="page-title">{t(lang, "int_title")}</h1>
          <p className="muted">{t(lang, "int_body")}</p>
          <p className="tiny muted" style={{ margin: 0 }}>{t(lang, "int_hint")}</p>

          <div className="row" style={{ flexWrap: "wrap", gap: "0.5rem" }}>
            {INTEREST_SLUGS.map((slug) => {
              const on = interests.has(slug);
              return (
                <button
                  key={slug}
                  type="button"
                  className={`btn btn-sm ${on ? "btn-primary" : "btn-ghost"}`}
                  aria-pressed={on}
                  onClick={() => toggleInterest(slug)}
                >
                  {t(lang, `int_${slug}`)}
                </button>
              );
            })}
          </div>

          <p className="tiny muted" style={{ margin: 0 }}>
            {t(lang, "int_selected", { n: interests.size })}
          </p>

          {err && (
            <p className="status-note error-note" style={{ margin: 0 }} role="alert">
              {err}
            </p>
          )}

          <div className="row">
            <button className="btn btn-primary" onClick={finish} disabled={busy}>
              {busy ? t(lang, "pub_submitting") : t(lang, "ob_finish")}
            </button>
            <button className="btn btn-ghost" onClick={() => setStage("step_identity")} disabled={busy}>
              {t(lang, "common_back")}
            </button>
            <button className="btn btn-ghost" onClick={finish} disabled={busy}>
              {t(lang, "int_skip")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
