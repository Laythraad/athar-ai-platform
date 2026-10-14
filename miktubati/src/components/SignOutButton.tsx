"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { browserSupabase } from "@/lib/supabase/client";

export default function SignOutButton({ label }: { label: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function signOut() {
    setBusy(true);
    const sb = browserSupabase();
    if (sb) await sb.auth.signOut();
    setBusy(false);
    router.push("/");
    router.refresh();
  }

  return (
    <button type="button" onClick={signOut} className="btn btn-ghost btn-sm" disabled={busy}>
      {label}
    </button>
  );
}
