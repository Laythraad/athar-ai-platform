/* ATHAR Safety layer — danger detection + honest emergency guidance.
   Hard rules from the product spec:
     • never claim a report/alert was dispatched
     • never invent emergency numbers; only sourced, per-country entries
     • never diagnose a threat from geolocation alone
     • discussion of danger in a historical/educational context is NOT a
       crisis (e.g. "tell me about the fall of a city")                        */

export interface DangerVerdict {
  danger: boolean;
  /** short local-language instruction when danger is detected */
  guidance?: string;
  countryIso?: string;
}

export interface EmergencyInfo {
  country: { en: string; ar: string; iso: string };
  unified: string | null;
  police: string | null;
  ambulance: string | null;
  fire: string | null;
  source: string;
  sourceUrl: string | null;
  checked: string;
  note: { en: string; ar: string };
}

/* Sourced emergency numbers. `checked` is the last verification month. */
const EMERGENCY: EmergencyInfo[] = [
  {
    country: { en: "Iraq", ar: "العراق", iso: "IQ" },
    unified: "911",
    police: null,
    ambulance: null,
    fire: null,
    source: "Iraqi government public-safety announcements (unified 112/911 rollout)",
    sourceUrl: null,
    checked: "2026-10",
    note: {
      en: "Iraq has been rolling out the unified 911/112 emergency number. Verify it works where you are; specialised local numbers may still apply.",
      ar: "تُنفّذ العراق أرقام الطوارئ الموحدة 911/112. تحقق من عملها في منطقتك؛ وقد تبقى أرقام تخصصية محلية.",
    },
  },
  {
    country: { en: "Jordan", ar: "الأردن", iso: "JO" },
    unified: "911",
    police: null,
    ambulance: null,
    fire: null,
    source: "Publicly published Jordanian emergency number",
    sourceUrl: null,
    checked: "2026-10",
    note: { en: "Unified emergency number.", ar: "رقم طوارئ موحد." },
  },
  {
    country: { en: "United Arab Emirates", ar: "الإمارات", iso: "AE" },
    unified: "999",
    police: "999",
    ambulance: "998",
    fire: "997",
    source: "UAE government published emergency numbers",
    sourceUrl: "https://u.ae/",
    checked: "2026-10",
    note: { en: "Police 999 / Ambulance 998 / Fire 997.", ar: "الشرطة 999 / الإسعاف 998 / الإطفاء 997." },
  },
  {
    country: { en: "Saudi Arabia", ar: "السعودية", iso: "SA" },
    unified: "911",
    police: "999",
    ambulance: "997",
    fire: "998",
    source: "Saudi authorities published emergency numbers",
    sourceUrl: null,
    checked: "2026-10",
    note: { en: "Multiple service numbers in use.", ar: "توجد أرقام متعددة للخدمات." },
  },
  {
    country: { en: "Qatar", ar: "قطر", iso: "QA" },
    unified: "999",
    police: "999",
    ambulance: "999",
    fire: "999",
    source: "Qatar public safety published numbers",
    sourceUrl: null,
    checked: "2026-10",
    note: { en: "Unified 999.", ar: "الرقم الموحد 999." },
  },
  {
    country: { en: "Kuwait", ar: "الكويت", iso: "KW" },
    unified: "112",
    police: "112",
    ambulance: "112",
    fire: "112",
    source: "Kuwait public safety published numbers",
    sourceUrl: null,
    checked: "2026-10",
    note: { en: "Unified 112.", ar: "الرقم الموحد 112." },
  },
  {
    country: { en: "Egypt", ar: "مصر", iso: "EG" },
    unified: "122",
    police: "122",
    ambulance: "123",
    fire: "180",
    source: "Egyptian government published numbers",
    sourceUrl: null,
    checked: "2026-10",
    note: { en: "Police 122 / Ambulance 123 / Fire 180.", ar: "الشرطة 122 / الإسعاف 123 / الإطفاء 180." },
  },
  {
    country: { en: "Turkey", ar: "تركيا", iso: "TR" },
    unified: "112",
    police: "155",
    ambulance: "112",
    fire: "110",
    source: "Turkish authorities published numbers",
    sourceUrl: null,
    checked: "2026-10",
    note: { en: "Unified 112 emergency medical; police 155.", ar: "الطوارئ الطبية 112؛ الشرطة 155." },
  },
];

export function emergencyFor(iso: string | null | undefined): EmergencyInfo | null {
  if (!iso) return null;
  return EMERGENCY.find((e) => e.country.iso === iso.toUpperCase()) ?? null;
}

export function allEmergencies(): EmergencyInfo[] {
  return EMERGENCY;
}

/* ── danger detection ──────────────────────────────────────────────────── */

/* First-person crisis phrases in ar/en. Kept narrow on purpose — a false
   negative here is safer than hijacking every historical discussion. */
const DANGER_AR =
  /(أنا بخطر|انا بخطر|يسحقني|يقتلوني|طارق يطارق|اعتداء عليه|اعتداء علي|يوجد منفّذ|اختطفوني|اغتصبوني|انتحار|سوف اموت|سأنتحر|تنفّثني|يضرني|هاجموني|يهاجمني|مهاجم|مطاردني|يطاردني|حرقوني|اعتصمت|حادث سير خطير|حادثة خطيرة|انفجار قربي|يوجد جرحى|انقطعت عنكم اذا|لا يستطيع أحد مساعدتي|ساعدوني الآن|يوجد شخص يضربني)/;
const DANGER_EN =
  /\b(i'?m being attacked|i am being attacked|someone is (trying to )?(kill|hurt) me|is attacking me|attacker (is|has)|he'?s going to kill me|she'?s going to kill me|assailant|i was kidnapped|they kidnapped me|i'?m being followed right now|he'?s (holding|pointing) a (gun|knife)|help me please someone|the building (is|was) (on fire|i'?m trapped)|i overdosed|i took too many pills|i'?m cutting myself|suicide now|i'?m going to kill myself right now|car crash just happened someone is (bleeding|dying)|explosion just happened near me)\b/i;

/* Educational/historical framing that must NOT trigger the safety path. */
const DISCUSSION_AR = /(في الرواية|في القصة|في الفيلم|تاريخياً|تاريخيا|كـنموذج|كمثال|أدب|قصة عن|رواية|سؤال عن|ماذا لو|في درس|امتحان|كتاب)/;
const DISCUSSION_EN =
  /\b(in the (novel|story|film|movie|book|poem)|historically|as an example|for (a|an|my) (essay|assignment|exam|class|lesson|homework)|fictional|plot|character)\b/i;

const COUNTRY_AR = /(في العراق|بالعراق|بغداد|البصرة|الموصل|أربيل|كربلاء|النجف|اربد)/;
const COUNTRY_EN = /\b(in|near|from|around)\s+(iraq|baghdad|basra|mosul|erbil|karbala|najaf|umm qasr)\b/i;
const ISO_MAP: Record<string, string> = {
  iraq: "IQ", baghdad: "IQ", basra: "IQ", mosul: "IQ", erbil: "IQ", karbala: "IQ", najaf: "IQ",
  jordan: "JO", amman: "JO",
  uae: "AE", "united arab emirates": "AE", dubai: "AE", abudhabi: "AE", "abu dhabi": "AE",
  "saudi arabia": "SA", saudi: "SA", riyadh: "SA", jeddah: "JA",
  qatar: "QA", doha: "QA",
  kuwait: "KW",
  egypt: "EG", cairo: "EG",
  turkey: "TR", turkiye: "TR", istanbul: "TR", ankara: "TR",
};

function detectCountryIso(q: string): string | undefined {
  const s = q.toLowerCase();
  for (const [needle, iso] of Object.entries(ISO_MAP)) {
    if (s.includes(needle)) return iso;
  }
  if (COUNTRY_AR.test(q) || COUNTRY_EN.test(q)) return "IQ";
  return undefined;
}

const GUIDANCE_BY_ISO: Record<string, { en: string; ar: string }> = {
  IQ: {
    en: "If you are in immediate danger in Iraq, call 911 (unified emergency number — verify it works where you are). Move to a safer place if you can do so without increasing the danger. ATHAR cannot send help for you — please contact local emergency services yourself.",
    ar: "إذا كنت في خطر فوري في العراق، اتصل بالرقم 911 (رقم الطوارئ الموحد — تحقق من عمله في منطقتك). انتقل إلى مكان أكثر أماناً إذا كان ذلك ممكناً دون زيادة الخطر. لا يستطيع ATHAR إرسال المساعدة نيابةً عنك — يرجى الاتصال بخدمات الطوارئ المحلية بنفسك.",
  },
  AE: {
    en: "If you are in immediate danger in the UAE, call 999 (police) or 998 (ambulance). Move to a safer place if you can. ATHAR cannot send help for you — please contact local emergency services yourself.",
    ar: "إذا كنت في خطر فوري في الإمارات، اتصل بالشرطة 999 أو الإسعاف 998. انتقل إلى مكان أكثر أماناً إذا أمكن. لا يستطيع ATHAR إرسال المساعدة — يرجى الاتصال بالطوارئ المحلية بنفسك.",
  },
  TR: {
    en: "If you are in immediate danger in Turkey, call 112 (emergency medical) or 155 (police). ATHAR cannot send help for you — please contact local emergency services yourself.",
    ar: "إذا كنت في خطر فوري في تركيا، اتصل بالطوارئ الطبية 112 أو الشرطة 155. لا يستطيع ATHAR إرسال المساعدة — يرجى الاتصال بالطوارئ المحلية بنفسك.",
  },
  EG: {
    en: "If you are in immediate danger in Egypt, call 122 (police) or 123 (ambulance). ATHAR cannot send help for you — please contact local emergency services yourself.",
    ar: "إذا كنت في خطر فوري في مصر، اتصل بالشرطة 122 أو الإسعاف 123. لا يستطيع ATHAR إرسال المساعدة — يرجى الاتصال بالطوارئ المحلية بنفسك.",
  },
  JO: {
    en: "If you are in immediate danger in Jordan, call 911. ATHAR cannot send help for you — please contact local emergency services yourself.",
    ar: "إذا كنت في خطر فوري في الأردن، اتصل بالرقم 911. لا يستطيع ATHAR إرسال المساعدة — يرجى الاتصال بالطوارئ المحلية بنفسك.",
  },
};

const GENERIC_GUIDANCE = {
  en: "If you are in immediate danger, call your local emergency number now and move to a safer place if you can. ATHAR cannot send an alert or contact authorities on your behalf.",
  ar: "إذا كنت في خطر فوري، اتصل برقم الطوارئ المحلي فوراً وانتقل إلى مكان أكثر أماناً إذا أمكن. لا يستطيع ATHAR إرسال تنبيه أو التواصل مع السلطات نيابةً عنك.",
};

/** Detect an active-crisis message. Educational discussion never triggers it. */
export function detectDanger(q: string, opts?: { lang?: string }): DangerVerdict {
  const s = (q || "").trim();
  if (!s) return { danger: false };
  // discussion context always wins
  if (DISCUSSION_AR.test(s) || DISCUSSION_EN.test(s)) return { danger: false };
  const hit = DANGER_AR.test(s) || DANGER_EN.test(s);
  if (!hit) return { danger: false };

  const iso = detectCountryIso(s);
  const guidance = GUIDANCE_BY_ISO[iso ?? ""] ?? GENERIC_GUIDANCE;
  const lang = opts?.lang === "ar" ? "ar" : "en";
  return { danger: true, guidance: guidance[lang], countryIso: iso };
}
