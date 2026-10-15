"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { Lang } from "@/lib/i18n";
import { t } from "@/lib/i18n";

type Item = { href: string; icon: string; label: string };
type Section = { title: string; items: Item[] };

/** Header dropdown: grouped sections, icon chip + text per link. */
export default function NavMenu({
  lang,
  canPublish,
  canSeeAdmin,
  pending,
}: {
  lang: Lang;
  canPublish: boolean;
  canSeeAdmin: boolean;
  pending: boolean;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [lastPath, setLastPath] = useState(pathname);
  const rootRef = useRef<HTMLDivElement>(null);

  /* close when the route changes (render-time adjustment — no effect) */
  if (lastPath !== pathname) {
    setLastPath(pathname);
    if (open) setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const explore: Item[] = [
    { href: "/", icon: "🏛️", label: t(lang, "nav_home") },
    { href: "/heritage", icon: "🗿", label: t(lang, "nav_heritage") },
    { href: "/heritage/map", icon: "🗺️", label: t(lang, "her_map_title") },
    { href: "/search", icon: "🔍", label: t(lang, "search_title") },
  ];
  const assistant: Item[] = [
    { href: "/ai", icon: "🤖", label: t(lang, "nav_ai") },
    { href: "/nearby", icon: "📍", label: t(lang, "nav_nearby") },
  ];
  const read: Item[] = [
    { href: "/library", icon: "📚", label: t(lang, "nav_library") },
    { href: "/my-library", icon: "🔒", label: t(lang, "nav_mylib") },
    { href: "/guidelines", icon: "📜", label: t(lang, "nav_guidelines") },
  ];
  const travel: Item[] = [
    { href: "/travel", icon: "🧳", label: t(lang, "nav_travel") },
    { href: "/travel/airports", icon: "✈️", label: t(lang, "travel_airports") },
    { href: "/travel/trip", icon: "🗺️", label: t(lang, "travel_mytrip") },
    { href: "/safety", icon: "🆘", label: t(lang, "nav_safety") },
  ];
  const create: Item[] = [
    { href: "/studio", icon: "🎨", label: t(lang, "nav_studio") },
    { href: "/kids", icon: "🧒", label: t(lang, "nav_kids") },
    { href: "/passport", icon: "🛂", label: t(lang, "nav_passport") },
  ];
  const write: Item[] = [];
  if (!pending && canPublish) {
    write.push(
      { href: "/publish", icon: "✍️", label: t(lang, "nav_publish") },
      { href: "/my", icon: "🕯️", label: t(lang, "nav_my") },
      { href: "/my-works", icon: "🗂️", label: t(lang, "nav_myworks") },
    );
  }
  const account: Item[] = [];
  if (!pending && canSeeAdmin) {
    account.push({ href: "/admin", icon: "⚙️", label: t(lang, "nav_admin") });
  }

  const sections: Section[] = [
    { title: t(lang, "nav_sec_explore"), items: explore },
    { title: t(lang, "nav_sec_ai"), items: assistant },
    { title: t(lang, "nav_sec_read"), items: read },
    { title: t(lang, "nav_sec_travel"), items: travel },
    { title: t(lang, "nav_sec_tools"), items: create },
    ...(write.length ? [{ title: t(lang, "nav_sec_write"), items: write }] : []),
    ...(account.length ? [{ title: t(lang, "nav_sec_account"), items: account }] : []),
  ];

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className="nav-menu" ref={rootRef}>
      <button
        type="button"
        className="nav-menu-btn"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span aria-hidden="true">☰</span>
        <span>{t(lang, "nav_menu")}</span>
      </button>
      {open && (
        <div className="nav-menu-panel" role="menu">
          {sections.map((sec) => (
            <div key={sec.title}>
              <p className="nav-menu-sec">{sec.title}</p>
              {sec.items.map((it) => {
                const active = isActive(it.href);
                return (
                  <Link
                    key={it.href}
                    href={it.href}
                    role="menuitem"
                    className={`nav-menu-item${active ? " is-active" : ""}`}
                    onClick={() => setOpen(false)}
                  >
                    <span className="nav-menu-icon" aria-hidden="true">
                      {it.icon}
                    </span>
                    <span>{it.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
