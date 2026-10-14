"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { browserSupabase } from "@/lib/supabase/client";
import { t, type Lang } from "@/lib/i18n";

export default function MyWorkActions({ workId, lang }: { workId: string; lang: Lang }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);

  async function remove() {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    const sb = browserSupabase();
    if (!sb) return;
    setBusy(true);
    // RLS: author can delete own work; child rows cascade.
    await sb.from("works").delete().eq("id", workId);
    setBusy(false);
    setConfirming(false);
    router.refresh();
  }

  return (
    <div className="row">
      <button
        type="button"
        className="btn btn-ghost btn-sm"
        onClick={() => router.push(`/work/${workId}`)}
      >
        {t(lang, "mw_view")}
      </button>
      <button
        type="button"
        className="btn btn-ghost btn-sm"
        onClick={() => router.push(`/publish?edit=${workId}`)}
      >
        {t(lang, "mw_edit")}
      </button>
      <button
        type="button"
        className="btn btn-ghost btn-sm"
        onClick={remove}
        disabled={busy}
        style={confirming ? { borderColor: "#b5443a", color: "#b5443a" } : undefined}
      >
        {confirming ? t(lang, "mw_delete_confirm") : t(lang, "mw_delete")}
      </button>
    </div>
  );
}
