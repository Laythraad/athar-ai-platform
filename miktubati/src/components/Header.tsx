import Link from "next/link";
import { Suspense } from "react";
import { io } from "next/cache";
import { getSession, type SessionSummary } from "@/lib/session";
import { t, type Lang } from "@/lib/i18n";
import { isDbConfigured } from "@/lib/env";
import { isRoleAtLeast } from "@/lib/roles";
import LangSwitcher from "./LangSwitcher";
import ThemeToggle from "./ThemeToggle";
import SignOutButton from "./SignOutButton";
import NavMenu from "./NavMenu";
import Customizer from "./Customizer";

/**
 * Top navigation. Server component — reads the session on every request.
 *
 * The session read is deferred with `io()`: Supabase's session code
 * reads the wall clock (`Date.now()`), which cacheComponents rejects while
 * prerendering. The static shell keeps only the request-neutral parts; the
 * auth-dependent slot streams in per request behind the Suspense boundary.
 */
export default function Header({ lang }: { lang: Lang }) {
  return (
    <Suspense fallback={<HeaderNav lang={lang} session={null} pending />}>
      <HeaderSession lang={lang} />
    </Suspense>
  );
}

async function HeaderSession({ lang }: { lang: Lang }) {
  await io();
  const session = await getSession();
  return <HeaderNav lang={lang} session={session} />;
}

function HeaderNav({
  lang,
  session,
  pending = false,
}: {
  lang: Lang;
  session: SessionSummary | null;
  pending?: boolean;
}) {
  const dbReady = isDbConfigured();
  const signedIn = Boolean(session?.userId);
  const canPublish = signedIn && session?.stage === "member" && !session.isBlocked;
  const canSeeAdmin = isRoleAtLeast(session?.role ?? null, "moderator");

  return (
    <header className="hdr">
      <div className="hdr-inner">
        <Link href="/" className="brand">
          <span className="brand-mark" aria-hidden="true">
            🏛️
          </span>
          <span className="brand-text">
            <span className="brand-name">{t(lang, "brand")}</span>
            <span className="brand-sub">{t(lang, "brand_sub")}</span>
          </span>
        </Link>

        <NavMenu
          lang={lang}
          canPublish={canPublish}
          canSeeAdmin={canSeeAdmin}
          pending={pending}
        />

        <div className="hdr-right">
          <form className="hdr-search" role="search" method="get" action="/search">
            <input
              type="search"
              name="q"
              placeholder={t(lang, "search_ph")}
              aria-label={t(lang, "search_title")}
            />
          </form>
          <LangSwitcher current={lang} />
          <ThemeToggle lang={lang} />
          <Customizer lang={lang} />
          {pending ? (
            <span className="hdr-user" aria-hidden="true" />
          ) : signedIn ? (
            <div className="hdr-user">
              <Link href="/my" className="hdr-penname">
                {session?.profile?.pen_name ?? t(lang, "auth_checking")}
              </Link>
              <SignOutButton label={t(lang, "nav_signout")} />
            </div>
          ) : (
            <Link href="/signin" className="btn btn-primary btn-sm">
              {t(lang, "nav_signin")}
            </Link>
          )}
        </div>
      </div>

      {!dbReady && (
        <div className="hdr-banner" role="status">
          {t(lang, "common_offline_db")}
        </div>
      )}
    </header>
  );
}
