import Link from "next/link";
import { t, type Lang } from "@/lib/i18n";

export default function Footer({ lang }: { lang: Lang }) {
  return (
    <footer className="ftr">
      <div className="ftr-inner">
        <div className="ftr-brand">
          <span className="brand-name">{t(lang, "brand")}</span>
          <span className="tagline">{t(lang, "tagline")}</span>
        </div>
        <nav className="ftr-nav" aria-label="Footer">
          <Link href="/">{t(lang, "nav_home")}</Link>
          <Link href="/heritage">{t(lang, "nav_heritage")}</Link>
          <Link href="/library">{t(lang, "nav_library")}</Link>
          <Link href="/guidelines">{t(lang, "nav_guidelines")}</Link>
        </nav>
        <p className="ftr-note">{t(lang, "lib_unverified")}</p>
      </div>
    </footer>
  );
}
