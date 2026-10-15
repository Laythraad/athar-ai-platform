import { type NextRequest } from "next/server";
import { requireUser, err, ok } from "@/lib/server/api";
import { adminSupabase } from "@/lib/supabase/admin";
import { IRAQ_SITES } from "@/lib/heritage/data";

/* GET  /api/passport — caller's visited sites
   POST { siteId, visited? } — upsert a visit (true) or remove (false)       */

const SITE_IDS = new Set(IRAQ_SITES.map((s) => s.id));

export async function GET() {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  const admin = adminSupabase();
  if (!admin) return err(503, "service_role_not_configured");

  const { data: rows } = await admin
    .from("user_passport")
    .select("site_id, visited_at")
    .eq("user_id", auth.session.userId!)
    .order("visited_at", { ascending: false });

  return ok({ visits: rows ?? [] });
}

export async function POST(request: NextRequest) {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  let body: { siteId?: unknown; visited?: unknown };
  try {
    body = await request.json();
  } catch {
    return err(400, "bad_json");
  }

  const siteId = typeof body.siteId === "string" ? body.siteId : "";
  if (!SITE_IDS.has(siteId)) return err(422, "passport_bad_site");

  const admin = adminSupabase();
  if (!admin) return err(503, "service_role_not_configured");

  if (body.visited === false) {
    await admin.from("user_passport").delete().eq("user_id", auth.session.userId!).eq("site_id", siteId);
    return ok({ removed: true });
  }

  const { error } = await admin
    .from("user_passport")
    .upsert({ user_id: auth.session.userId!, site_id: siteId, visited_at: new Date().toISOString() }, {
      onConflict: "user_id,site_id",
    });

  if (error) return err(500, "passport_save_fail", error.message);
  return ok({ siteId, visited: true });
}
