import { NextResponse, type NextRequest } from "next/server";
import { serverSupabase } from "@/lib/supabase/server";
import { adminSupabase } from "@/lib/supabase/admin";

/* GET /api/work-file?id=<workId>[&view=1]
   Issues a short-lived signed URL for a PRIVATE work file and redirects to it.

   Access rules (all checked here; storage buckets are private so the signed
   URL is the only way in):
      • the work must be visible to the caller — RLS on `works` already limits
        this to published works or the author's own rows
      • `&view=1` (reader embed) skips the download gate: anyone who can see
        the work may view it
      • without `view`, if the author disabled downloads only the author may
        fetch the file
      • the object path comes from `work_files`, never from the query string,
        so a caller cannot point the signer at an arbitrary bucket path */

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id") ?? "";
  if (!id) return NextResponse.json({ ok: false, errorKey: "id_required" }, { status: 400 });

  const supabase = await serverSupabase();
  if (!supabase) {
    return NextResponse.json({ ok: false, errorKey: "db_not_configured" }, { status: 503 });
  }

  // RLS-scoped read: published works, or the caller's own work at any status.
  const { data: work } = await supabase
    .from("works")
    .select("id, author_id, status, allow_download, file_path")
    .eq("id", id)
    .maybeSingle();

  if (!work) {
    return NextResponse.json({ ok: false, errorKey: "work_not_found" }, { status: 404 });
  }

  // `view=1` means "embed it in the reader" — anyone who can see the work may
  // view it. Without it the endpoint is a download, which the author can turn
  // off for everyone but themselves.
  const viewOnly = request.nextUrl.searchParams.get("view") === "1";

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isAuthor = Boolean(user && user.id === work.author_id);

  if (!viewOnly && !isAuthor && !work.allow_download) {
    return NextResponse.json({ ok: false, errorKey: "download_not_allowed" }, { status: 403 });
  }

  // Resolve the real storage object from work_files (source of truth).
  const { data: fileRow } = await supabase
    .from("work_files")
    .select("storage_path, mime")
    .eq("work_id", id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const storagePath = fileRow?.storage_path ?? work.file_path;
  if (!storagePath) {
    return NextResponse.json({ ok: false, errorKey: "no_file" }, { status: 404 });
  }

  const admin = adminSupabase();
  if (!admin) {
    return NextResponse.json({ ok: false, errorKey: "service_role_not_configured" }, { status: 503 });
  }

  const { data: signed, error } = await admin.storage
    .from("work-files")
    .createSignedUrl(storagePath, 300); // 5 minutes

  if (error || !signed?.signedUrl) {
    return NextResponse.json({ ok: false, errorKey: "sign_failed" }, { status: 500 });
  }

  // The Location header carries a short-lived signed token — never cache it.
  return NextResponse.redirect(signed.signedUrl, {
    headers: { "Cache-Control": "private, no-store" },
  });
}
