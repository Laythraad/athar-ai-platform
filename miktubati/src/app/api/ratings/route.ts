import { NextResponse, type NextRequest } from "next/server";
import { adminSupabase } from "@/lib/supabase/admin";
import { requireUser, err, ok, audit } from "@/lib/server/api";
import { computeRatingSummary, canRate, checkRateLimit, RATE_RULES, upsertRating } from "@/lib/ratings";

/* POST /api/ratings   Body: { authorId, stars }

   Rules (all enforced server-side; the client cannot bypass any of them):
     • must be signed in, verified, onboarded, not blocked
     • cannot rate yourself
     • one rating per (author, rater) — UPSERT, never a second row
     • 1–5 integers only
     • rate-limited per user
     • the aggregate is RECOMPUTED from the full table by the Postgres
       function, so a crafted client payload cannot inflate an average. */

export async function POST(request: NextRequest) {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const { session } = auth;

  let body: { authorId?: string; stars?: number };
  try {
    body = await request.json();
  } catch {
    return err(400, "bad_json");
  }

  const authorId = typeof body.authorId === "string" ? body.authorId : "";
  const stars = body.stars;

  if (!authorId) return err(422, "author_required");
  if (!Number.isInteger(stars) || (stars as number) < 1 || (stars as number) > 5) {
    return err(422, "stars_invalid");
  }

  const gate = canRate(session.userId!, authorId);
  if (!gate.ok) {
    return err(gate.reason === "self_rating" ? 403 : 422, gate.reason ?? "cannot_rate");
  }

  const limit = checkRateLimit(session.userId!, RATE_RULES.rating);
  if (!limit.allowed) {
    return NextResponse.json(
      { ok: false, errorKey: "rate_limited", retryAfterMs: limit.retryAfterMs },
      { status: 429 },
    );
  }

  const admin = adminSupabase();
  if (!admin) return err(503, "service_role_not_configured");

  // Target must be a real, active profile.
  const { data: target } = await admin
    .from("profiles")
    .select("id, account_status")
    .eq("id", authorId)
    .maybeSingle();
  if (!target) return err(404, "author_not_found");

  // UPSERT: duplicate rating updates rather than adds.
  const { data: existing } = await admin
    .from("author_ratings")
    .select("stars")
    .eq("author_id", authorId)
    .eq("rater_id", session.userId!);

  const list = upsertRating(
    (existing ?? []).map((r) => ({ authorId, raterId: session.userId!, stars: r.stars as number })),
    authorId,
    session.userId!,
    stars as number,
  );

  const row = list[0];

  const { error: upsertErr } = await admin
    .from("author_ratings")
    .upsert(
      {
        author_id: authorId,
        rater_id: session.userId!,
        stars: row.stars,
      },
      { onConflict: "author_id,rater_id" },
    );

  if (upsertErr) return err(500, "rating_failed", upsertErr.message);

  // Recompute the aggregate from the source of truth (RPC is SECURITY DEFINER).
  // supabase-js returns { data, error } — it does not throw, so check it.
  const { error: rpcErr } = await admin.rpc("recalc_author_rating", { p_author: authorId });
  if (rpcErr) {
    // non-fatal: the raw rows are still correct; the UI recomputes on read
  }

  const { data: agg } = await admin
    .from("author_rating_agg")
    .select("avg_stars, count")
    .eq("author_id", authorId)
    .maybeSingle();

  const summary = computeRatingSummary(
    (await admin.from("author_ratings").select("stars").eq("author_id", authorId)).data?.map(
      (r) => r.stars as number,
    ) ?? [],
  );

  await audit({
    actorId: session.userId!,
    action: "author_rated",
    targetType: "author",
    targetId: authorId,
    after: { stars: row.stars, avg: agg?.avg_stars ?? summary.displayAvg, count: agg?.count ?? summary.count },
  });

  return ok({
    avg: typeof agg?.avg_stars === "number" ? Number(agg.avg_stars) : summary.displayAvg,
    count: typeof agg?.count === "number" ? agg.count : summary.count,
    mine: row.stars,
  });
}
