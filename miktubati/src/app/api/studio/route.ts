import { type NextRequest } from "next/server";
import { requireUser, err, ok, audit } from "@/lib/server/api";
import { adminSupabase } from "@/lib/supabase/admin";
import { sanitizeText } from "@/lib/validation/sanitize";

/* GET  /api/studio — caller's creative works (drafts)
   POST { kind, title, body } — create a draft (poem | story | note)        */

const KINDS = new Set(["poem", "story", "note"]);

export async function GET() {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  const admin = adminSupabase();
  if (!admin) return err(503, "service_role_not_configured");

  const { data: works } = await admin
    .from("creative_works")
    .select("id, kind, title, body, created_at, updated_at")
    .eq("user_id", auth.session.userId!)
    .order("updated_at", { ascending: false })
    .limit(200);

  return ok({ works: works ?? [] });
}

export async function POST(request: NextRequest) {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  let body: { kind?: unknown; title?: unknown; body?: unknown };
  try {
    body = await request.json();
  } catch {
    return err(400, "bad_json");
  }

  const kind = typeof body.kind === "string" && KINDS.has(body.kind) ? body.kind : null;
  if (!kind) return err(422, "studio_bad_kind");

  const title = sanitizeText(String(body.title ?? "")).slice(0, 200);
  const text = sanitizeText(String(body.body ?? "")).slice(0, 100_000);
  if (!title && !text) return err(422, "studio_empty");

  const admin = adminSupabase();
  if (!admin) return err(503, "service_role_not_configured");

  const { data: work, error } = await admin
    .from("creative_works")
    .insert({ user_id: auth.session.userId!, kind, title, body: text })
    .select("id, kind, title, body, created_at, updated_at")
    .single();

  if (error || !work) return err(500, "studio_save_fail", error?.message);

  void audit({
    actorId: auth.session.userId!,
    action: "studio_draft_created",
    targetType: "creative_work",
    targetId: work.id,
    after: { kind, title },
  });

  return ok({ work }, 201);
}
