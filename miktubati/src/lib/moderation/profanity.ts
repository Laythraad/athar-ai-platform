/* Rule-based moderation word lists.
   ⚠️ These lists contain slurs and profanity on purpose — that is their job.
   They are matched ONLY after normalisation (see normalize.ts), so obfuscated
   spellings (elongation, diacritics, spacing, look-alike letters) are caught too.

   Policy (deliberate, and the reason we split hard from soft):
   • HARD  → auto-reject. Explicit sexual terms, slurs, sectarian/ethnic hate.
   • SOFT  → needs_human_review, NEVER auto-reject. Violence and sexual words
             that legitimately appear in literature, history and heritage
             writing (war memoirs, tragedy, classical poetry). We do not censor
             real literature — a human decides.
   The AI layer is the broad catch; the rule layer is the hard floor. */

/** Hard-reject terms: explicit sexual terms and direct slurs. */
export const HARD_TERMS_AR: string[] = [
  "سكس",
  "نيك",
  "كس",
  "زب",
  "قضيب",
  "احلية",
  "خنزير",
];

/** Violence / incitement words → a human reviews them (literature-safe). */
export const VIOLENCE_TERMS_AR: string[] = [
  "قتل",
  "اقتل",
  "أقتل",
  "تفجير",
  "اغتصاب",
  "انتحر",
  "ساحقكم",
  "حرقهم",
  "تعذيب",
];

/** Sexual words that appear in serious literature → human review. */
export const SEXUAL_SOFT_TERMS_AR: string[] = [
  "جماع",
  "زنا",
  "عري",
  "شهوة",
  "غراء",
  "حميمة",
];

/** Historical / documentary words → human review (heritage writing needs them). */
export const DOCUMENTARY_SOFT_TERMS_AR: string[] = [
  "دم",
  "حرب",
  "مذبحة",
  "مذابح",
  "ISIS",
  "داعش",
  "القاعده",
];

/** Sectarian / ethnic hate → always reject. */
export const SECTARIAN_TERMS_AR: string[] = [
  "الرافضة",
  "النصارى الخونة",
  "اليهود الخونة",
  "السنّة الكفرة",
  "المسلمين الكفرة",
  "ملحد خبيث",
];

/** Legacy alias used by rules.ts — kept for a single import point. */
export const SOFT_TERMS_AR: string[] = [
  ...VIOLENCE_TERMS_AR,
  ...SEXUAL_SOFT_TERMS_AR,
  ...DOCUMENTARY_SOFT_TERMS_AR,
];

/** Latin/English hard terms (kept short and precise). */
export const HARD_TERMS_EN: string[] = [
  "kill yourself",
  "kys",
  "go die",
  "rape",
  "child porn",
  "fuck you",
  "nigger",
  "faggot",
];

/** Latin/English soft terms → human review. */
export const SOFT_TERMS_EN: string[] = [
  "kill them",
  "i will kill",
  "war crime",
  "massacre",
];

/** Spam / link heuristics. */
export const SPAM_PATTERNS: RegExp[] = [
  /https?:\/\/\S+/gi,
  /www\.\S+/gi,
  /\b(wa|telegram|t\.me|discord\.gg|bit\.ly|tinyurl)\b/i,
  /(.)\1{4,}/, // "ااااااا" style or "aaaaaa"
  /\b(buy now|click here|free money|earn \$)\b/i,
];
