"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { browserSupabase } from "@/lib/supabase/client";
import { t, type Lang } from "@/lib/i18n";

const OPTIONS = [
  { key: "favorite", label: "my_add_fav" },
  { key: "reading", label: "my_add_reading" },
  { key: "want_to_read", label: "my_add_want" },
  { key: "finished", label: "my_add_finished" },
] as const;

export default function ReadingControls({
  workId,
  current,
  lang,
}: {
  workId: string;
  current: string;
  lang: Lang;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function setStatus(status: string) {
    const sb = browserSupabase();
    if (!sb) return;
    setBusy(true);
    const { data: { user } } = await sb.auth.getUser();
    if (!user) {
      setBusy(false);
      router.push(`/signin?next=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    // RLS restricts to own rows; upsert on (user_id, work_id).
    const { error } = await sb.from("reading_list").upsert(
      { user_id: user.id, work_id: workId, status, updated_at: new Date().toISOString() },
      { onConflict: "user_id,work_id" },
    );
    if (error) {
      alert(t(lang, "common_error"));
    }
    setBusy(false);
    router.refresh();
  }

  async function remove() {
    const sb = browserSupabase();
    if (!sb) return;
    setBusy(true);
    const { error } = await sb.from("reading_list").delete().eq("work_id", workId);
    if (error) {
      alert(t(lang, "common_error"));
    }
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="row">
      {OPTIONS.map((o) => (
        <button
          key={o.key}
          type="button"
          className={`chip${current === o.key ? " on" : ""}`}
          disabled={busy}
          onClick={() => setStatus(o.key)}
        >
          {t(lang, o.label)}
        </button>
      ))}
      <button type="button" className="btn btn-ghost btn-sm" disabled={busy} onClick={remove}>
        {t(lang, "my_remove")}
      </button>
    </div>
  );
}
