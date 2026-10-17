import { randomUUID, createHash } from "node:crypto";
import { type NextRequest } from "next/server";
import { requireUser, audit, err, ok } from "@/lib/server/api";
import { adminSupabase } from "@/lib/supabase/admin";
import { ALLOWED_FILE_MIME, MAX_FILE_BYTES } from "@/lib/validation/work";
import { checkRateLimit, RATE_RULES } from "@/lib/ratings";

/* POST /api/upload   (multipart/form-data, field name: `file`)

   Publishing a work is PDF-first: the client uploads the file here, gets back
   a storage path, and passes that path to POST /api/publish.

   Everything is checked server-side; the browser cannot talk to the private
   `work-files` bucket directly:
     • must be a signed-in, verified, non-blocked member
     • MIME must be in the allow-list (PDF, txt, md)
     • size 1 byte … 20 MB
     • PDFs must actually start with "%PDF-" (guards against a renamed .exe)
     • stored under `<uid>/<uuid>.<ext>` so the storage delete policy matches */

function extFor(mime: string): string {
  if (mime === "application/pdf") return "pdf";
  if (mime === "text/markdown") return "md";
  return "txt";
}

export async function POST(request: NextRequest) {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const userId = auth.session.userId!;

  // Same budget as publish — upload is the first half of that expensive flow.
  const rl = checkRateLimit(userId, RATE_RULES.publish);
  if (!rl.allowed) return err(429, "rate_limited");

  const admin = adminSupabase();
  if (!admin) return err(503, "service_role_not_configured");

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return err(400, "bad_form");
  }

  const file = form.get("file");
  if (!(file instanceof File)) return err(422, "file_required");

  const mime = (file.type || "").toLowerCase();
  if (!(ALLOWED_FILE_MIME as readonly string[]).includes(mime)) {
    return err(422, "file_type_not_allowed");
  }

  const size = file.size;
  if (size <= 0) return err(422, "file_empty");
  if (size > MAX_FILE_BYTES) return err(413, "file_too_large");

  const bytes = Buffer.from(await file.arrayBuffer());

  if (mime === "application/pdf") {
    const header = bytes.subarray(0, 1024).toString("latin1");
    if (!header.includes("%PDF-")) return err(422, "not_a_pdf");
  }

  const path = `${userId}/${randomUUID()}.${extFor(mime)}`;

  const { error: upErr } = await admin.storage.from("work-files").upload(path, bytes, {
    contentType: mime,
    cacheControl: "3600",
    upsert: false,
  });
  if (upErr) return err(500, "upload_failed", upErr.message);

  const hash = createHash("sha256").update(bytes).digest("hex");

  await audit({
    actorId: userId,
    action: "work_file_uploaded",
    targetType: "storage",
    targetId: path,
    after: { mime, size, sha256: hash },
  });

  return ok({ path, mime, size, hash }, 201);
}
