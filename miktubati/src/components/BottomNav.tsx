"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { t, type Lang } from "@/lib/i18n";

/**
 * Mobile bottom tab bar — the app-like shell. Hidden on wide screens by CSS.
 * "Publish" is the centre action; auth-dependent items degrade to sign-in.
 */
export default function BottomNav({ lang }: { lang: Lang }) {
  const pathname = usePathname();

  const tabs = [
    { href: "/", icon: "🏛️", label: t(lang, "tab_home"), match: (p: string) => p === "/" },
    { href: "/heritage", icon: "🗿", label: t(lang, "tab_heritage"), match: (p: string) => p.startsWith("/heritage") },
    { href: "/library", icon: "📚", label: t(lang, "tab_library"), match: (p: string) => p.startsWith("/library") || p.startsWith("/work") },
    { href: "/publish", icon: "✍️", label: t(lang, "tab_publish"), match: (p: string) => p.startsWith("/publish"), fab: true },
    { href: "/my", icon: "🕯️", label: t(lang, "tab_my"), match: (p: string) => p.startsWith("/my") || p.startsWith("/admin") },
  ];

  return (
    <nav className="bottom-nav" aria-label={t(lang, "nav_menu")}>
      {tabs.map((tab) => {
        const active = tab.match(pathname);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`bn-tab${active ? " is-active" : ""}${tab.fab ? " bn-fab" : ""}`}
            aria-current={active ? "page" : undefined}
          >
            <span className="bn-icon" aria-hidden="true">{tab.icon}</span>
            <span className="bn-label">{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
