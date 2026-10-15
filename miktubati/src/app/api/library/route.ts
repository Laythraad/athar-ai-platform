import { randomUUID, createHash } from "node:crypto";
import { type NextRequest } from "next/server";
import { requireUser, audit, err, ok } from "@/lib/server/api";
import { adminSupabase } from "@/lib/supabase/admin";
import { sanitizeText } from "@/lib/validation/sanitize";
import {
  LIB_ALLOWED_MIME,
  LIB_MAX_BYTES,
  libKindFor,
  cleanExtractedText,
  hasPdfMagic,
  extFor,
} from "@/lib/validation/library";
import { extractPdfText } from "@/lib/files/pdf";

const BUCKET = "library-files";

/* GET  /api/library — list the caller's items (RLS + explicit user scope)
   POST /api/library — add a private file (multipart, field name "file")   */

export async function GET() {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  const admin = adminSupabase();
  if (!admin) return err(503, "service_role_not_configured");

  const { data: items, error } = await admin
    .from("library_items")
    .select(
      "id, kind, title, file_mime, file_size, is_favorite, last_page, last_opened_at, created_at, pages_total",
    )
    .eq("user_id", auth.session.userId!)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) return err(500, "list_failed", error.message);
  return ok({ items: items ?? [] });
}

export async function POST(request: NextRequest) {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const userId = auth.session.userId!;

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return err(400, "bad_form");
  }

  const file = form.get("file");
  if (!(file instanceof File)) return err(422, "file_required");
  if (file.size === 0) return err(422, "file_empty");
  if (file.size > LIB_MAX_BYTES) return err(413, "lib_too_big");

  const mime = (file.type || "").toLowerCase();
  const kind = libKindFor(mime);
  if (!kind || !LIB_ALLOWED_MIME[mime]) return err(415, "lib_bad_type");

  const bytes = new Uint8Array(await file.arrayBuffer());

  // PDF magic-byte check — the client's MIME claim is never trusted alone
  if (kind === "pdf" && !hasPdfMagic(bytes)) return err(415, "lib_bad_type");

  const admin = adminSupabase();
  if (!admin) return err(503, "service_role_not_configured");

  const title = sanitizeText(String(form.get("title") ?? "")).slice(0, 200).trim() || file.name.slice(0, 200);
  const storagePath = `${userId}/${randomUUID()}.${extFor(mime)}`;
  const sha = createHash("sha256").update(bytes).digest("hex");

  // private bucket — only the owner prefix is reachable (RLS on storage.objects)
  const { error: upErr } = await admin.storage.from(BUCKET).upload(storagePath, bytes, {
    contentType: mime,
    upsert: false,
  });
  if (upErr) return err(500, "lib_upload_fail", upErr.message);

  let contentText: string | null = null;
  const pagesTotal: number | null = null;
  if (kind === "pdf") {
    const raw = await extractPdfText(bytes);
    contentText = cleanExtractedText(raw) || null;
  } else if (kind === "text") {
    contentText = cleanExtractedText(new TextDecoder().decode(bytes)).slice(0, 200_000) || null;
  }

  const { data: item, error } = await admin
    .from("library_items")
    .insert({
      user_id: userId,
      kind,
      title,
      file_path: storagePath,
      file_mime: mime,
      file_size: file.size,
      content_text: contentText,
      pages_total: pagesTotal,
    })
    .select("id, kind, title, file_mime, file_size, is_favorite, last_page, created_at, pages_total")
    .single();

  if (error || !item) {
    // rollback the orphan object
    await admin.storage.from(BUCKET).remove([storagePath]).catch(() => undefined);
    return err(500, "lib_save_fail", error?.message);
  }

  void audit({
    actorId: userId,
    action: "library_item_added",
    targetType: "library_item",
    targetId: item.id,
    after: { kind, title, sha256: sha, size: file.size },
  });

  return ok({ item }, 201);
}
