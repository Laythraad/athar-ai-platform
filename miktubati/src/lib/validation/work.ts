/* Input validation for publishing a work. Zod v4. */

import { z } from "zod";
import { sanitizeContent, sanitizeTags, sanitizeText } from "./sanitize";

export const CATEGORY_SLUGS = [
  "poetry", "novels", "short", "history", "essays", "heritage", "science", "children", "other",
] as const;

export const MAX_TEXT_CONTENT = 200_000;
export const MAX_FILE_BYTES = 20 * 1024 * 1024; // 20 MB
export const ALLOWED_FILE_MIME = [
  "application/pdf",
  "text/plain",
  "text/markdown",
] as const;

export const publishWorkSchema = z
  .object({
    title: z.string().trim().min(1).max(200),
    description: z.string().trim().max(2000).optional().default(""),
    category: z.enum(CATEGORY_SLUGS),
    tags: z.array(z.string()).max(12).optional().default([]),
    language: z.enum(["ar", "en"]).optional().default("ar"),
    content: z.string().max(MAX_TEXT_CONTENT).optional().default(""),
    allowDownload: z.boolean().optional().default(false),
    heritageSiteId: z.string().trim().max(60).optional().nullable(),
    coverPath: z.string().trim().max(300).optional().nullable(),
    filePath: z.string().trim().max(300).optional().nullable(),
    fileMime: z.string().trim().max(100).optional().nullable(),
    fileSize: z.number().int().positive().max(MAX_FILE_BYTES).optional().nullable(),
    fileHash: z.string().trim().max(128).optional().nullable(),
    ownsRights: z.literal(true, {
      // Sentinel i18n key — the client renders it via t(lang, "val_rights").
      // Never shown raw to the user.
      message: "val_rights",
    }),
  })
  .superRefine((val, ctx) => {
    const hasText = (val.content ?? "").trim().length > 0;
    const hasFile = !!(val.filePath && val.filePath.length > 0);
    if (!hasText && !hasFile) {
      ctx.addIssue({
        code: "custom",
        path: ["content"],
        message: "val_content_or_file",
      });
    }
    if (hasFile && val.fileMime && !(ALLOWED_FILE_MIME as readonly string[]).includes(val.fileMime)) {
      ctx.addIssue({
        code: "custom",
        path: ["fileMime"],
        message: "val_file_type",
      });
    }
    if (hasFile && val.fileSize && val.fileSize > MAX_FILE_BYTES) {
      ctx.addIssue({ code: "custom", path: ["fileSize"], message: "val_file_size" });
    }
  });

export type PublishWorkInput = z.infer<typeof publishWorkSchema>;

/** Sanitise + validate in one step. Returns either the clean value or a list
    of human-readable field errors. Never throws on bad input. */
export function validatePublish(raw: unknown):
  | { ok: true; value: Omit<PublishWorkInput, "tags"> & { tags: string[] } }
  | { ok: false; errors: Record<string, string> } {
  const parsed = publishWorkSchema.safeParse(raw);
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      if (!errors[key]) errors[key] = issue.message;
    }
    return { ok: false, errors };
  }
  const v = parsed.data;
  return {
    ok: true,
    value: {
      ...v,
      title: sanitizeText(v.title),
      description: sanitizeText(v.description ?? ""),
      content: sanitizeContent(v.content ?? ""),
      tags: sanitizeTags(v.tags ?? []),
    },
  };
}
