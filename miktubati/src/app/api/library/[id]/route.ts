import { type NextRequest } from "next/server";
import { requireUser, audit, err, ok } from "@/lib/server/api";
import { adminSupabase } from "@/lib/supabase/admin";
import { sanitizeText } from "@/lib/validation/sanitize";

type Params = { params: Promise<{ id: string }> };
const BUCKET = "library-files";

/* GET    /api/library/[id] — metadata + short-lived signed URL
   PATCH  /api/library/[id] — { title?, isFavorite?, lastPage?, contentText? }
   DELETE /api/library/[id] — remove row + storage object                    */

export async function GET(_request: NextRequest, { params }: Params) {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const { id } = await params;

  const admin = adminSupabase();
  if (!admin) return err(503, "service_role_not_configured");

  const { data: item } = await admin
    .from("library_items")
    .select("id, kind, title, file_path, file_mime, file_size, content_text, pages_total, last_page, is_favorite, created_at")
    .eq("id", id)
    .eq("user_id", auth.session.userId!)
    .maybeSingle();

  if (!item) return err(404, "item_not_found");

  let fileUrl: string | null = null;
  if (item.file_path) {
    const signed = await admin.storage.from(BUCKET).createSignedUrl(item.file_path, 300);
    fileUrl = signed.data?.signedUrl ?? null;
  }

  // touch last_opened_at (best-effort)
  await admin.from("library_items").update({ last_opened_at: new Date().toISOString() }).eq("id", id);

  return ok({
    item: {
      id: item.id,
      kind: item.kind,
      title: item.title,
      fileUrl,
      content_text: item.content_text,
      pages_total: item.pages_total,
      last_page: item.last_page,
      is_favorite: item.is_favorite,
      file_mime: item.file_mime,
    },
  });
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const { id } = await params;

  let body: { title?: unknown; isFavorite?: unknown; lastPage?: unknown; contentText?: unknown };
  try {
    body = await request.json();
  } catch {
    return err(400, "bad_json");
  }

  const patch: Record<string, unknown> = {};
  if (typeof body.title === "string") {
    const title = sanitizeText(body.title).slice(0, 200).trim();
    if (!title) return err(422, "title_required");
    patch.title = title;
  }
  if (typeof body.isFavorite === "boolean") patch.is_favorite = body.isFavorite;
  if (typeof body.lastPage === "number" && Number.isFinite(body.lastPage)) {
    patch.last_page = Math.max(1, Math.floor(body.lastPage));
  }
  if (typeof body.contentText === "string") {
    patch.content_text = sanitizeText(body.contentText).slice(0, 200_000);
  }
  if (Object.keys(patch).length === 0) return err(422, "nothing_to_update");
  patch.updated_at = new Date().toISOString();

  const admin = adminSupabase();
  if (!admin) return err(503, "service_role_not_configured");

  const { data, error } = await admin
    .from("library_items")
    .update(patch)
    .eq("id", id)
    .eq("user_id", auth.session.userId!)
    .select("id")
    .maybeSingle();

  if (error || !data) return err(404, "item_not_found", error?.message);
  return ok({ id: data.id });
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const { id } = await params;

  const admin = adminSupabase();
  if (!admin) return err(503, "service_role_not_configured");

  const { data: item } = await admin
    .from("library_items")
    .select("id, file_path, title")
    .eq("id", id)
    .eq("user_id", auth.session.userId!)
    .maybeSingle();

  if (!item) return err(404, "item_not_found");

  if (item.file_path) {
    await admin.storage.from(BUCKET).remove([item.file_path]).catch(() => undefined);
  }

  const { error } = await admin.from("library_items").delete().eq("id", id).eq("user_id", auth.session.userId!);
  if (error) return err(500, "delete_failed", error.message);

  void audit({
    actorId: auth.session.userId!,
    action: "library_item_deleted",
    targetType: "library_item",
    targetId: id,
    before: { title: item.title },
  });

  return ok({ deleted: true });
}
