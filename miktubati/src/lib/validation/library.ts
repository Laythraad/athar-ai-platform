/* My Library file validation — shared by the upload API and its tests.
   Hard rules (product spec §9):
     • MIME allowlist + PDF magic-byte check (never trust the client)
     • 25 MB cap
     • kind derived server-side from the MIME type
     • extracted text is cleaned (page markers stripped) before storage      */

export const LIB_MAX_BYTES = 25 * 1024 * 1024;

export const LIB_ALLOWED_MIME: Record<string, "pdf" | "text" | "image"> = {
  "application/pdf": "pdf",
  "text/plain": "text",
  "text/markdown": "text",
  "image/jpeg": "image",
  "image/png": "image",
  "image/webp": "image",
};

export type LibKind = "pdf" | "text" | "image" | "note";

export function libKindFor(mime: string): LibKind | null {
  return LIB_ALLOWED_MIME[mime.toLowerCase()] ?? null;
}

/** `%PDF-` magic bytes — the client's MIME claim is never trusted alone. */
export function hasPdfMagic(bytes: Uint8Array): boolean {
  if (bytes.length < 5) return false;
  return (
    bytes[0] === 0x25 && // %
    bytes[1] === 0x50 && // P
    bytes[2] === 0x44 && // D
    bytes[3] === 0x46 && // F
    bytes[4] === 0x2d // -
  );
}

const PAGE_MARKER = /\s*--\s*\d+\s+of\s+\d+\s*--/g;

/** Strip pdf-parse page markers and collapse whitespace. */
export function cleanExtractedText(raw: string): string {
  return raw
    .replace(PAGE_MARKER, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Extension used for the storage object path. */
export function extFor(mime: string): string {
  switch (mime.toLowerCase()) {
    case "application/pdf":
      return "pdf";
    case "text/markdown":
      return "md";
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    default:
      return "txt";
  }
}
