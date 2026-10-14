"use client";

import { useEffect } from "react";
import { t, type Lang } from "@/lib/i18n";
import { useLang } from "@/lib/useLang";

/** Route error boundary. Shown when a page throws during render. */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const lang = useLang("ar" as Lang);

  useEffect(() => {
    // In a real deployment this is where you would report to an error tracker.
    console.error(error);
  }, [error]);

  return (
    <div className="panel card stack" style={{ textAlign: "center" }}>
      <h1 className="page-title">{t(lang, "common_something_wrong")}</h1>
      <p className="muted" style={{ margin: 0 }}>
        {t(lang, "common_retry")}
      </p>
      <div className="row" style={{ justifyContent: "center" }}>
        <button type="button" className="btn btn-primary btn-sm" onClick={reset}>
          {t(lang, "common_retry")}
        </button>
      </div>
    </div>
  );
}
