/** Only allow same-origin absolute paths. Rejects `//evil.com`, `/\evil.com`,
    `javascript:`, and anything that is not a single leading `/`. */
export function safeNext(next: string | null | undefined, fallback = "/onboarding"): string {
  if (!next) return fallback;
  if (!next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  if (/[\x00-\x1f\x7f]/.test(next)) return fallback;
  return next;
}
