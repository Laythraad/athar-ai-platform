"use client";

import { useSyncExternalStore } from "react";
import { t, type Lang } from "@/lib/i18n";

type Mode = "light" | "dark" | "auto";
const MODES: Mode[] = ["light", "dark", "auto"];
const KEY = "mkt_theme";

/* localStorage-backed store. `useSyncExternalStore` is the correct React 19
   pattern for reading an external system — it avoids setState-in-effect. */
let listeners: Array<() => void> = [];
let cached: Mode | null = null;

function read(): Mode {
  if (typeof window === "undefined") return "auto";
  if (cached === null) {
    const s = localStorage.getItem(KEY) as Mode | null;
    cached = s && MODES.includes(s) ? s : "auto";
  }
  return cached;
}
function subscribe(cb: () => void) {
  listeners.push(cb);
  return () => {
    listeners = listeners.filter((l) => l !== cb);
  };
}
function emit() {
  listeners.forEach((l) => l());
}
function getServerSnapshot(): Mode {
  return "auto";
}

function applyToDom(mode: Mode) {
  const el = document.documentElement;
  if (mode === "auto") el.removeAttribute("data-theme");
  else el.setAttribute("data-theme", mode);
  /* keep mkt_prefs.theme in sync so the inline script (which prefers
     prefs.theme) does not restore a stale value on the next load */
  try {
    const raw = localStorage.getItem("mkt_prefs");
    if (raw) {
      const prefs = JSON.parse(raw) as Record<string, unknown>;
      prefs.theme = mode;
      localStorage.setItem("mkt_prefs", JSON.stringify(prefs));
    }
  } catch {
    /* ignore */
  }
}

/** Cycle light → dark → auto. Persisted to localStorage; also applied by the
    inline script in layout.tsx before first paint (no flash). */
export default function ThemeToggle({ lang }: { lang: Lang }) {
  const mode = useSyncExternalStore(subscribe, read, getServerSnapshot);

  function cycle() {
    const idx = MODES.indexOf(mode);
    const next = MODES[(idx + 1) % MODES.length] ?? "auto";
    cached = next;
    localStorage.setItem(KEY, next);
    applyToDom(next);
    emit();
  }

  const label =
    mode === "light" ? t(lang, "theme_light") : mode === "dark" ? t(lang, "theme_dark") : t(lang, "theme_auto");

  return (
    <button
      type="button"
      className="theme-btn"
      onClick={cycle}
      aria-label={t(lang, "theme_label")}
      title={t(lang, "theme_label")}
    >
      {label}
    </button>
  );
}
