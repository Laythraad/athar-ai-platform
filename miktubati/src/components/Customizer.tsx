"use client";

import { useState, useSyncExternalStore } from "react";
import type { Lang } from "@/lib/i18n";
import { t } from "@/lib/i18n";

/** User appearance preferences — stored in localStorage.mkt_prefs and applied
    as CSS variables on <html> by the inline script in layout.tsx (no flash). */
export type Prefs = {
  theme: "light" | "dark" | "auto";
  accent: string;
  fontSize: "sm" | "md" | "lg";
  density: "compact" | "normal" | "roomy";
  radius: "soft" | "normal" | "round";
  font: "modern" | "naskh";
};

export const DEFAULT_PREFS: Prefs = {
  theme: "auto",
  accent: "#b4551d",
  fontSize: "md",
  density: "normal",
  radius: "normal",
  font: "modern",
};

export const ACCENTS: Array<{ value: string; label: string }> = [
  { value: "#b4551d", label: "نحاسي" },
  { value: "#0f766e", label: "فيروزي" },
  { value: "#7c2d91", label: "بنفسجي" },
  { value: "#b91c1c", label: "قرمزي" },
  { value: "#1d4ed8", label: "أزرق" },
  { value: "#15803d", label: "زيتوني" },
];

export function readPrefs(): Prefs {
  if (typeof window === "undefined") return DEFAULT_PREFS;
  try {
    const raw = localStorage.getItem("mkt_prefs");
    const base: Prefs = raw ? { ...DEFAULT_PREFS, ...JSON.parse(raw) } : { ...DEFAULT_PREFS };
    if (!raw) {
      const theme = localStorage.getItem("mkt_theme");
      if (theme === "light" || theme === "dark" || theme === "auto") base.theme = theme;
    }
    return base;
  } catch {
    return DEFAULT_PREFS;
  }
}

/* localStorage-backed store — same pattern as ThemeToggle. */
let listeners: Array<() => void> = [];
let cache: Prefs | null = null;

function subscribe(cb: () => void) {
  listeners.push(cb);
  return () => {
    listeners = listeners.filter((l) => l !== cb);
  };
}
function emit() {
  listeners.forEach((l) => l());
}
function readStore(): Prefs {
  if (typeof window === "undefined") return DEFAULT_PREFS;
  if (cache === null) cache = readPrefs();
  return cache;
}

export function applyPrefs(p: Prefs) {
  const el = document.documentElement;
  if (p.theme === "auto") el.removeAttribute("data-theme");
  else el.setAttribute("data-theme", p.theme);
  /* also persist to mkt_theme so ThemeToggle's cycle stays consistent */
  try {
    localStorage.setItem("mkt_theme", p.theme);
  } catch {
    /* private mode */
  }
  el.style.setProperty("--accent", p.accent);
  el.style.setProperty("--accent-strong", p.accent);
  el.style.setProperty("--font-scale", p.fontSize === "sm" ? "0.94" : p.fontSize === "lg" ? "1.1" : "1");
  el.style.setProperty("--pad-scale", p.density === "compact" ? "0.8" : p.density === "roomy" ? "1.25" : "1");
  el.style.setProperty("--radius", p.radius === "soft" ? "6px" : p.radius === "round" ? "18px" : "12px");
  el.style.setProperty(
    "--font-body",
    p.font === "naskh"
      ? '"Traditional Arabic", "Amiri", "Noto Naskh Arabic", "Segoe UI", serif'
      : '"Segoe UI", "Noto Sans Arabic", "Tahoma", system-ui, sans-serif',
  );
  el.style.setProperty("--accent-2", mixAccent(p.accent));
}

/** Derive the teal companion color from the chosen accent for gradients. */
function mixAccent(accent: string): string {
  if (accent.toLowerCase() === "#0f766e") return "#b4551d";
  return "#0f766e";
}

function Seg<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (v: T) => void;
}) {
  return (
    <div className="seg">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          className={`seg-btn${value === o.value ? " is-on" : ""}`}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export default function Customizer({ lang }: { lang: Lang }) {
  const [open, setOpen] = useState(false);
  const prefs = useSyncExternalStore(subscribe, readStore, () => DEFAULT_PREFS);

  function update(patch: Partial<Prefs>) {
    const next = { ...prefs, ...patch };
    cache = next;
    try {
      localStorage.setItem("mkt_prefs", JSON.stringify(next));
    } catch {
      /* private mode */
    }
    applyPrefs(next);
    emit();
  }

  return (
    <div className="nav-menu customizer">
      <button
        type="button"
        className="nav-menu-btn"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={t(lang, "custom_title")}
        title={t(lang, "custom_title")}
        onClick={() => setOpen((v) => !v)}
      >
        <span aria-hidden="true">🎨</span>
      </button>
      {open && (
        <div className="nav-menu-panel customizer-panel" role="dialog" aria-label={t(lang, "custom_title")}>
          <p className="customizer-title">{t(lang, "custom_title")}</p>

          <p className="customizer-label">{t(lang, "custom_theme")}</p>
          <Seg
            value={prefs.theme}
            onChange={(theme) => update({ theme })}
            options={[
              { value: "light", label: t(lang, "theme_light") },
              { value: "dark", label: t(lang, "theme_dark") },
              { value: "auto", label: t(lang, "theme_auto") },
            ]}
          />

          <p className="customizer-label">{t(lang, "custom_accent")}</p>
          <div className="swatches">
            {ACCENTS.map((a) => (
              <button
                key={a.value}
                type="button"
                className={`swatch${prefs.accent === a.value ? " is-on" : ""}`}
                style={{ background: a.value }}
                title={a.label}
                aria-label={a.label}
                onClick={() => update({ accent: a.value })}
              />
            ))}
            <input
              type="color"
              className="swatch-input"
              value={prefs.accent}
              aria-label={t(lang, "custom_accent")}
              onChange={(e) => update({ accent: e.target.value })}
            />
          </div>

          <p className="customizer-label">{t(lang, "custom_fontsize")}</p>
          <Seg
            value={prefs.fontSize}
            onChange={(fontSize) => update({ fontSize })}
            options={[
              { value: "sm", label: "أ" },
              { value: "md", label: "أ" },
              { value: "lg", label: "أ" },
            ]}
          />

          <p className="customizer-label">{t(lang, "custom_density")}</p>
          <Seg
            value={prefs.density}
            onChange={(density) => update({ density })}
            options={[
              { value: "compact", label: t(lang, "custom_compact") },
              { value: "normal", label: t(lang, "custom_normal") },
              { value: "roomy", label: t(lang, "custom_roomy") },
            ]}
          />

          <p className="customizer-label">{t(lang, "custom_radius")}</p>
          <Seg
            value={prefs.radius}
            onChange={(radius) => update({ radius })}
            options={[
              { value: "soft", label: t(lang, "custom_soft") },
              { value: "normal", label: t(lang, "custom_normal") },
              { value: "round", label: t(lang, "custom_round") },
            ]}
          />

          <p className="customizer-label">{t(lang, "custom_font")}</p>
          <Seg
            value={prefs.font}
            onChange={(font) => update({ font })}
            options={[
              { value: "modern", label: t(lang, "custom_modern") },
              { value: "naskh", label: t(lang, "custom_naskh") },
            ]}
          />

          <button
            type="button"
            className="btn btn-ghost btn-sm customizer-reset"
            onClick={() => {
              try {
                localStorage.removeItem("mkt_prefs");
              } catch {
                /* ignore */
              }
              cache = DEFAULT_PREFS;
              applyPrefs(DEFAULT_PREFS);
              emit();
            }}
          >
            {t(lang, "custom_reset")}
          </button>
        </div>
      )}
    </div>
  );
}
