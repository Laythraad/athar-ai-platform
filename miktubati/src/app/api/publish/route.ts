import { NextResponse, type NextRequest } from "next/server";
import { adminSupabase } from "@/lib/supabase/admin";
import { requireUser, audit, recordModeration, err, ok } from "@/lib/server/api";
import { validatePublish } from "@/lib/validation/work";
import { sanitizeContent, sanitizeText, sanitizeTags } from "@/lib/validation/sanitize";
import { moderate, verdictToStatus, forceHumanReview } from "@/lib/moderation/pipeline";
import { suggestTags, mergeTags } from "@/lib/ai/enrich";
import { extractPdfTextFromStorage } from "@/lib/files/pdf";
import { isGeminiConfigured, readDbEnv } from "@/lib/env";
import { checkRateLimit, RATE_RULES } from "@/lib/ratings";

/* POST /api/publish
   Body: { title, description?, category, content?, tags?, language?,
           ownsRights, filePath?, fileMime?, fileSize? }

   Pipeline (every submission, no exceptions):
     rate-limit → validate → sanitize → moderate (rules → Gemini, fail-closed)
       → insert → status = verdictToStatus(verdict)

   The client can NEVER set `status`. A DB trigger forces `pending_review` on
   insert, and only the service role (this route) may change it afterwards —
   so even a compromised browser cannot publish itself past moderation. */

export async function POST(request: NextRequest) {
  const env = readDbEnv();
  if (!env.url || !env.anonKey) return err(503, "db_not_configured");

  const auth = await requireUser();
  if (auth.error) return auth.error;
  const { session } = auth;
  const userId = session.userId!;

  // Rate-limit: publish is the most expensive route (PDF extract + Gemini ×2).
  const rl = checkRateLimit(userId, RATE_RULES.publish);
  if (!rl.allowed) return err(429, "rate_limited");

  let raw: Record<string, unknown>;
  try {
    raw = await request.json();
  } catch {
    return err(400, "bad_json");
  }

  const validated = validatePublish(raw as never);
  if (!validated.ok) {
    return NextResponse.json(
      { ok: false, errorKey: "validation_failed", errors: validated.errors },
      { status: 422 },
    );
  }

  const v = validated.value;

  // filePath must be the caller's own upload (`<uid>/<uuid>.<ext>`). Without
  // this check a signed-in attacker could point at another user's object and
  // exfiltrate it via /api/work-file (which trusts works.file_path).
  if (v.filePath && !v.filePath.startsWith(`${userId}/`)) {
    return err(400, "file_path_forbidden");
  }

  const admin = adminSupabase();
  if (!admin) return err(503, "service_role_not_configured");

  // Defensive re-sanitise (validatePublish already sanitises; belt and braces).
  const title = sanitizeText(v.title).slice(0, 200);
  const description = v.description ? sanitizeText(v.description).slice(0, 1000) : null;
  const content = v.content ? sanitizeContent(v.content) : null;
  let tags = sanitizeTags(v.tags ?? []);

  // ── PDF: read the file's text so it goes through the same pipeline ─────
  const pdfText = v.filePath ? await extractPdfTextFromStorage(admin, v.filePath) : "";
  const moderatedText =
    [content, pdfText]
      .filter((s): s is string => Boolean(s && s.trim()))
      .join("\n\n")
      .trim() || null;
  // A file with no readable text (scanned / image-only PDF) can never be
  // auto-approved — it always falls through to a human reviewer.
  const fileUnreadable = Boolean(v.filePath) && !moderatedText;

  // When the author uploaded a PDF and typed nothing, the file's own text
  // becomes the readable body — so the work can be searched and translated
  // like any other. The author's own words always win.
  const storedContent = content ?? (pdfText ? sanitizeContent(pdfText) : null);

  // ── AI tag enrichment (non-blocking, additive) ────────────────────────
  if (isGeminiConfigured()) {
    const aiTags = await suggestTags({
      title,
      description,
      content: moderatedText,
      language: v.language,
    });
    tags = mergeTags(tags, aiTags);
  }

  // ── moderation ────────────────────────────────────────────────────────
  let result = await moderate({
    title,
    description: description ?? undefined,
    content: moderatedText ?? undefined,
    penName: session.profile?.pen_name,
    language: v.language,
  });

  if (fileUnreadable) result = forceHumanReview(result);

  const status = verdictToStatus(result.verdict);

  // ── duplicate guard (same author, same title) ─────────────────────────
  // Escape LIKE wildcards so a title containing % or _ can't false-positive.
  const escapedTitle = title.replace(/[\\%_]/g, (m) => `\\${m}`);
  const { data: dupe } = await admin
    .from("works")
    .select("id")
    .eq("author_id", userId)
    .ilike("title", escapedTitle)
    .limit(1);
  if (dupe && dupe.length > 0) return err(409, "duplicate_title");

  // ── insert. `status` is written by the service role only; the DB trigger
  //    would have forced pending_review regardless if a client tried. ─────
  const { data: inserted, error: insertErr } = await admin
    .from("works")
    .insert({
      author_id: userId,
      title,
      description,
      content: storedContent,
      category: v.category,
      tags,
      language: v.language,
      file_path: v.filePath ?? null,
      file_mime: v.fileMime ?? null,
      file_size: v.fileSize ?? null,
      file_hash: v.fileHash ?? null,
      allow_download: v.allowDownload ?? false,
      heritage_site_id: v.heritageSiteId ?? null,
      cover_path: v.coverPath ?? null,
      status,
      published_at: status === "published" ? new Date().toISOString() : null,
    })
    .select("id")
    .single();

  if (insertErr || !inserted) {
    // The DB dedupe trigger raises `duplicate_title` (P0001) on a race that
    // slipped past the pre-check — surface it as 409, not a generic 500.
    if (insertErr?.message === "duplicate_title") return err(409, "duplicate_title");
    return err(500, "publish_failed", insertErr?.message);
  }

  const workId = inserted.id as string;

  // Mirror the stored object into `work_files` (the source of truth the
  // download endpoint signs from). Best-effort: /api/work-file falls back to
  // `works.file_path` if this row is somehow missing.
  if (v.filePath && v.fileSize) {
    await admin.from("work_files").insert({
      work_id: workId,
      storage_path: v.filePath,
      mime: v.fileMime || "application/pdf",
      size_bytes: v.fileSize,
      sha256: v.fileHash ?? null,
    });
  }

  await recordModeration({
    actorId: null,
    workId,
    verdict: result.verdict,
    source: result.source,
    categories: result.categories,
    reasons: result.reasons,
    flagged: result.flagged,
    confidence: result.confidence,
  });

  await audit({
    actorId: userId,
    action: "work_submitted",
    targetType: "work",
    targetId: workId,
    after: {
      status,
      verdict: result.verdict,
      source: result.source,
      gemini: isGeminiConfigured(),
    },
  });

  return ok(
    {
      id: workId,
      status,
      verdict: result.verdict,
      source: result.source,
      categories: result.categories,
      reasons: result.reasons,
      flagged: result.flagged,
      confidence: result.confidence,
      errorKey: result.errorKey ?? null,
    },
    201,
  );
}

/* PATCH /api/publish  Body: { id, ...same as POST }

   Editing an existing work re-runs the full moderation pipeline and returns
   the work to `pending_review` (or auto-publish/reject per the verdict). The
   author can only edit their own work; `status` is never client-settable. */
export async function PATCH(request: NextRequest) {
  const env = readDbEnv();
  if (!env.url || !env.anonKey) return err(503, "db_not_configured");

  const auth = await requireUser();
  if (auth.error) return auth.error;
  const { session } = auth;
  const userId = session.userId!;

  let raw: Record<string, unknown>;
  try {
    raw = await request.json();
  } catch {
    return err(400, "bad_json");
  }

  const id = typeof raw.id === "string" ? raw.id : "";
  if (!id) return err(422, "id_required");

  const validated = validatePublish(raw as never);
  if (!validated.ok) {
    return NextResponse.json(
      { ok: false, errorKey: "validation_failed", errors: validated.errors },
      { status: 422 },
    );
  }

  const v = validated.value;

  // filePath must be the caller's own upload (`<uid>/<uuid>.<ext>`).
  if (v.filePath && !v.filePath.startsWith(`${userId}/`)) {
    return err(400, "file_path_forbidden");
  }

  const admin = adminSupabase();
  if (!admin) return err(503, "service_role_not_configured");

  const title = sanitizeText(v.title).slice(0, 200);
  const description = v.description ? sanitizeText(v.description).slice(0, 1000) : null;
  const content = v.content ? sanitizeContent(v.content) : null;
  let tags = sanitizeTags(v.tags ?? []);

  // Ownership check — also fetch the current file so we know what changed.
  const { data: existing } = await admin
    .from("works")
    .select("id, author_id, file_path, file_mime, file_size, file_hash")
    .eq("id", id)
    .maybeSingle();
  if (!existing) return err(404, "work_not_found");
  if (existing.author_id !== userId) return err(403, "not_owner");

  const prevPath = (existing.file_path ?? null) as string | null;
  const nextPath = v.filePath ?? prevPath;
  const nextMime = v.filePath
    ? (v.fileMime ?? "application/pdf")
    : ((existing.file_mime ?? null) as string | null);
  const nextSize = v.filePath
    ? (v.fileSize ?? ((existing.file_size ?? null) as number | null))
    : ((existing.file_size ?? null) as number | null);
  const nextHash = v.filePath
    ? (v.fileHash ?? ((existing.file_hash ?? null) as string | null))
    : ((existing.file_hash ?? null) as string | null);
  const fileChanged = Boolean(nextPath) && nextPath !== prevPath;

  // ── PDF: read the file's text so it goes through the same pipeline ─────
  const pdfText = nextPath ? await extractPdfTextFromStorage(admin, nextPath) : "";
  const moderatedText =
    [content, pdfText]
      .filter((s): s is string => Boolean(s && s.trim()))
      .join("\n\n")
      .trim() || null;
  const fileUnreadable = Boolean(nextPath) && !moderatedText;
  const storedContent = content ?? (pdfText ? sanitizeContent(pdfText) : null);

  // ── AI tag enrichment (non-blocking, additive) ────────────────────────
  if (isGeminiConfigured()) {
    const aiTags = await suggestTags({
      title,
      description,
      content: moderatedText,
      language: v.language,
    });
    tags = mergeTags(tags, aiTags);
  }

  // Re-moderate the edited content.
  let result = await moderate({
    title,
    description: description ?? undefined,
    content: moderatedText ?? undefined,
    penName: session.profile?.pen_name,
    language: v.language,
  });
  if (fileUnreadable) result = forceHumanReview(result);
  const status = verdictToStatus(result.verdict);

  const { data: updated, error: updErr } = await admin
    .from("works")
    .update({
      title,
      description,
      content: storedContent,
      category: v.category,
      tags,
      language: v.language,
      allow_download: v.allowDownload ?? false,
      heritage_site_id: v.heritageSiteId ?? null,
      file_path: nextPath,
      file_mime: nextMime,
      file_size: nextSize,
      file_hash: nextHash,
      status,
      published_at: status === "published" ? new Date().toISOString() : null,
      rejection_reason: status === "rejected" ? result.reasons.join(" | ") || null : null,
    })
    .eq("id", id)
    .select("id")
    .single();

  if (updErr || !updated) return err(500, "publish_failed", updErr?.message);

  // Keep the `work_files` mirror in step with the storage object and drop the
  // replaced file. (If nothing changed, we never touch storage.)
  if (fileChanged) {
    await admin.from("work_files").delete().eq("work_id", id);
    if (nextPath && nextSize) {
      await admin.from("work_files").insert({
        work_id: id,
        storage_path: nextPath,
        mime: nextMime || "application/pdf",
        size_bytes: nextSize,
        sha256: nextHash ?? null,
      });
    }
    if (prevPath && prevPath !== nextPath) {
      await admin.storage.from("work-files").remove([prevPath]);
    }
  }

  await recordModeration({
    actorId: userId,
    workId: id,
    verdict: result.verdict,
    source: result.source,
    categories: result.categories,
    reasons: result.reasons,
    flagged: result.flagged,
    confidence: result.confidence,
  });

  await audit({
    actorId: userId,
    action: "work_edited",
    targetType: "work",
    targetId: id,
    after: {
      status,
      verdict: result.verdict,
      source: result.source,
      gemini: isGeminiConfigured(),
    },
  });

  return ok({
    id,
    status,
    verdict: result.verdict,
    source: result.source,
    categories: result.categories,
    reasons: result.reasons,
    flagged: result.flagged,
    confidence: result.confidence,
    errorKey: result.errorKey ?? null,
  });
}
