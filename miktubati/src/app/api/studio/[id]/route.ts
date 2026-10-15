import { type NextRequest } from "next/server";
import { requireUser, err, ok, audit } from "@/lib/server/api";
import { adminSupabase } from "@/lib/supabase/admin";
import { sanitizeText } from "@/lib/validation/sanitize";

type Params = { params: Promise<{ id: string }> };

/* PATCH  /api/studio/[id] — { title?, body? }
   DELETE /api/studio/[id]                                                  */

export async function PATCH(request: NextRequest, { params }: Params) {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const { id } = await params;

  let body: { title?: unknown; body?: unknown };
  try {
    body = await request.json();
  } catch {
    return err(400, "bad_json");
  }

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (typeof body.title === "string") patch.title = sanitizeText(body.title).slice(0, 200);
  if (typeof body.body === "string") patch.body = sanitizeText(body.body).slice(0, 100_000);

  const admin = adminSupabase();
  if (!admin) return err(503, "service_role_not_configured");

  const { data, error } = await admin
    .from("creative_works")
    .update(patch)
    .eq("id", id)
    .eq("user_id", auth.session.userId!)
    .select("id")
    .maybeSingle();

  if (error || !data) return err(404, "item_not_found");
  return ok({ id: data.id });
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const { id } = await params;

  const admin = adminSupabase();
  if (!admin) return err(503, "service_role_not_configured");

  const { data } = await admin
    .from("creative_works")
    .delete()
    .eq("id", id)
    .eq("user_id", auth.session.userId!)
    .select("id")
    .maybeSingle();

  if (!data) return err(404, "item_not_found");

  void audit({
    actorId: auth.session.userId!,
    action: "studio_draft_deleted",
    targetType: "creative_work",
    targetId: id,
  });

  return ok({ deleted: true });
}
