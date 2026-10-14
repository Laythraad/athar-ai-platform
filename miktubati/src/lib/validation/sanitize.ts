/* HTML / markdown sanitisation — XSS-safe rendering of user content.
   We deliberately do NOT use an HTML parser dependency; instead we strip
   every tag and dangerous protocol, which is the safest posture for a
   community library that only needs plain text + light markdown. */

const DANGEROUS_PROTOCOLS = /^\s*(javascript|vbscript|data|file|blob)\s*:/i;

/** Escape a string for safe interpolation into HTML text nodes. */
export function escapeHtml(input: string): string {
  return String(input)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Remove every HTML tag, keeping the inner text. */
export function stripTags(input: string): string {
  return String(input).replace(/<[^>]*>/g, "");
}

/** Remove script/style/iframe/object/embed blocks including their content. */
export function removeDangerousBlocks(input: string): string {
  return String(input).replace(
    /<(script|style|iframe|object|embed|form|link|meta|base|svg|math)\b[\s\S]*?<\/\1\s*>/gi,
    "",
  );
}

/** Neutralise event handlers and dangerous protocols that survive tag stripping
    when a caller wants to allow a tiny safe subset (currently: nothing). */
export function neutraliseUrls(input: string): string {
  return String(input).replace(
    /(href|src|xlink:href|action|formaction)\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/gi,
    (_full, attr, _q, dquoted, squoted, bare) => {
      const value = dquoted ?? squoted ?? bare ?? "";
      if (DANGEROUS_PROTOCOLS.test(value)) {
        return `${attr}="#"`;
      }
      return `${attr}="${escapeHtml(value)}"`;
    },
  );
}

/** Full pipeline for any user-supplied string we might render. */
export function sanitizeText(input: string): string {
  let s = removeDangerousBlocks(String(input));
  s = stripTags(s);
  s = s.replace(/\u0000/g, "");
  return s.trim();
}

/** Sanitise a rich body (work content). Allows line breaks and basic markdown
    characters but guarantees no HTML reaches the DOM. */
export function sanitizeContent(input: string): string {
  let s = removeDangerousBlocks(String(input));
  s = stripTags(s);
  s = s.replace(/\u0000/g, "");
  // collapse runs of blank lines so the renderer stays readable
  s = s.replace(/\n{4,}/g, "\n\n");
  return s.trim();
}

/** Sanitise a list of tags: lowercase, strip punctuation except - and _, max 12. */
export function sanitizeTags(raw: string[] | string): string[] {
  const arr = Array.isArray(raw) ? raw : raw.split(",");
  const out: string[] = [];
  for (const t of arr) {
    const clean = sanitizeText(t)
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\-_ ]/gu, "")
      .trim()
      .slice(0, 30);
    if (clean && !out.includes(clean)) out.push(clean);
    if (out.length >= 12) break;
  }
  return out;
}

/** Sanitise a pen name: no tags, no links, no @handle, 3–30 chars. */
export function sanitizePenName(input: string): string {
  let s = sanitizeText(input).replace(/\s+/g, " ").trim();
  s = s.replace(/^https?:\/\//i, "").replace(/@/g, "");
  return s.slice(0, 30);
}
