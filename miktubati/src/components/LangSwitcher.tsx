"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { LANGS, type Lang } from "@/lib/i18n";

/** Language switcher — a compact dropdown (18 languages). Writes the cookie
    the server layout reads for lang/dir, then refreshes the RSC tree. */
export default function LangSwitcher({ current }: { current: Lang }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const active = LANGS.find((l) => l.code === current) ?? LANGS[0];

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

  function setLang(code: Lang) {
    setOpen(false);
    if (code === current) return;
    // Cookie write is a deliberate browser side effect, not a React state mutation.
    // eslint-disable-next-line react-hooks/immutability
    document.cookie = `mkt_lang=${code}; path=/; max-age=31536000; samesite=lax`;
    router.refresh();
  }

  return (
    <div className="lang-switch" ref={rootRef}>
      <button
        type="button"
        className="lang-btn"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        title="Language / اللغة / لەزگێڕان"
      >
        <span aria-hidden="true">🌐</span>
        <span>{active.native}</span>
      </button>
      {open && (
        <div className="lang-panel" role="listbox" aria-label="Language">
          {LANGS.map((l) => (
            <button
              key={l.code}
              type="button"
              role="option"
              aria-selected={l.code === current}
              className={`lang-option${l.code === current ? " is-on" : ""}`}
              onClick={() => setLang(l.code)}
            >
              {l.native}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
