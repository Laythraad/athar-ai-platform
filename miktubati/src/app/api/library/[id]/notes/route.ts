import { type NextRequest } from "next/server";
import { requireUser, err, ok } from "@/lib/server/api";
import { adminSupabase } from "@/lib/supabase/admin";
import { sanitizeText } from "@/lib/validation/sanitize";

type Params = { params: Promise<{ id: string }> };

/* GET  /api/library/[id]/notes — owner's notes for an item
   POST { body, page? } — add a private note                                 */

export async function GET(_request: NextRequest, { params }: Params) {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const { id } = await params;

  const admin = adminSupabase();
  if (!admin) return err(503, "service_role_not_configured");

  const { data: notes } = await admin
    .from("library_notes")
    .select("id, page, body, created_at")
    .eq("item_id", id)
    .eq("user_id", auth.session.userId!)
    .order("created_at", { ascending: false })
    .limit(100);

  return ok({ notes: notes ?? [] });
}

export async function POST(request: NextRequest, { params }: Params) {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const { id } = await params;

  let body: { body?: string; page?: number };
  try {
    body = await request.json();
  } catch {
    return err(400, "bad_json");
  }

  const text = sanitizeText(body.body ?? "").slice(0, 5000).trim();
  if (!text) return err(422, "note_required");

  const admin = adminSupabase();
  if (!admin) return err(503, "service_role_not_configured");

  const { data: item } = await admin
    .from("library_items")
    .select("id")
    .eq("id", id)
    .eq("user_id", auth.session.userId!)
    .maybeSingle();
  if (!item) return err(404, "item_not_found");

  const page = typeof body.page === "number" && body.page >= 1 ? Math.floor(body.page) : null;

  const { data: note, error } = await admin
    .from("library_notes")
    .insert({ user_id: auth.session.userId!, item_id: id, page, body: text })
    .select("id, page, body, created_at")
    .single();

  if (error || !note) return err(500, "note_failed", error?.message);
  return ok({ note }, 201);
}
