/* ATHAR Travel — cultural guidance per Iraqi governorate ("know before you
   go"). Guidance, NOT law. Every entry carries a `lawNote` that points to
   official verification rather than asserting legal claims. Customs vary by
   community and context — these notes are summaries, not stereotypes. */

export interface CultureGuide {
  govKey: string;
  dress: { en: string; ar: string };
  photo: { en: string; ar: string };
  greetings: { en: string; ar: string };
  markets: { en: string; ar: string };
  lawNote: { en: string; ar: string };
}

export const CULTURE_GUIDES: CultureGuide[] = [
  {
    govKey: "Baghdad",
    dress: {
      en: "Casual dress is fine in daily life; modest clothing is appreciated in religious neighbourhoods and shrines (shoulders and knees covered; head covering for women at Shia holy sites).",
      ar: "الملابس اليومية العادية مناسبة؛ ويُقدَّر اللباس المتواضع في الأحياء الدينية والمقدسات (تغطية الكتفين والرجلين، وتغطية رأس النساء في المواقع الشيعية المقدسة).",
    },
    photo: {
      en: "Ask before photographing people; some government and military sites prohibit photography — obey posted signs.",
      ar: "اسأل قبل تصوير الأشخاص؛ ويُمنع التصوير في بعض المواقع الحكومية والعسكرية — التزم باللافتات.",
    },
    greetings: {
      en: "A warm 'salam alaykum' is the standard greeting; right-hand greetings and hospitality are customary.",
      ar: "التحية المعتادة «السلام عليكم»؛ والتحية باليد اليمنى والضيافة من العادات الشائعة.",
    },
    markets: {
      en: "Bargaining is normal in souqs; agree prices before ordering in taxis.",
      ar: "المساومة معتادة في الأسواق؛ واتفق على السعر قبل ركوب سيارات الأجرة.",
    },
    lawNote: {
      en: "Verify current entry and local rules with official Iraqi sources before travel.",
      ar: "تحقق من قواعد الدخول المحلية الحديثة من المصادر الرسمية العراقية قبل السفر.",
    },
  },
  {
    govKey: "Babil",
    dress: {
      en: "Hatra and Babylon are open-air sites — hat, water and closed shoes in summer.",
      ar: "حِضراء وبابل موقعان مفتوحان — قبعة وماء وحذاء مغلق في الصيف.",
    },
    photo: {
      en: "Photography at archaeological sites is generally allowed for personal use; obey site staff instructions.",
      ar: "التصوير في المواقع الأثرية مسموح عموماً للاستخدام الشخصي — التزم بتعليمات موظفي الموقع.",
    },
    greetings: {
      en: "Visitors are often greeted warmly by site staff and local guides.",
      ar: "يُرحَّب بالزوار عادةً من موظفي الموقع والمرشدين المحليين.",
    },
    markets: {
      en: "Hillah's markets are local; carry small cash.",
      ar: "أسواق الححلة محلية؛ احمل نقوداً صغيرة.",
    },
    lawNote: {
      en: "Removal of archaeological artefacts is illegal under Iraqi antiquities law — never touch or remove fragments.",
      ar: "إخراج الآثار مخالف لقانون الآثار العراقي — لا تلمس أو تخرج أي قطعة.",
    },
  },
  {
    govKey: "Basra",
    dress: {
      en: "Light clothing in the hot season; modest dress in shrines.",
      ar: "ملابس خفيفة في الموسم الحار؛ ولباس متواضع في المقدسات.",
    },
    photo: {
      en: "Ask before photographing marsh activities or private boats.",
      ar: "اسأل قبل تصوير أنشطة الأهوار أو القوارب الخاصة.",
    },
    greetings: {
      en: "Basrawi hospitality is famous — accept tea when offered.",
      ar: "ضيافة البصرة مشهورة — اقبل الشاي عند تقديمه.",
    },
    markets: {
      en: "Ashar market: agree prices; keep belongings close in crowds.",
      ar: "سوق العشار: تفاوض على الأسعار؛ واحتفظ بأغراضك في الأزدحام.",
    },
    lawNote: {
      en: "Marsh tour operators vary — choose licensed guides when possible and confirm prices up front.",
      ar: "جودة مشغلي جولات الأهوار تتفاوت — اختر مرشدين مرخصين متى أمكن وتأكد من الأسعار مسبقاً.",
    },
  },
  {
    govKey: "Karbala",
    dress: {
      en: "Strictly modest dress at the shrines; head covering for women; large bags may be checked.",
      ar: "لباس متواضع صارم عند الحرمين؛ تغطية رأس النساء؛ قد تُفحص الحقائب الكبيرة.",
    },
    photo: {
      en: "Photography inside shrine halls is often restricted — follow posted rules.",
      ar: "التصوير داخل صحن الحرمين مقيد غالباً — التزم بالقواعد المعلنة.",
    },
    greetings: {
      en: "Religious phrases are common in greetings around the shrines.",
      ar: "العبارات الدينية شائعة في التحيات حول الحرمين.",
    },
    markets: {
      en: "Crowded during pilgrimages — keep children close.",
      ar: "مزدحم خلال الموسم الزائري — ابقِ الأطفال قربك.",
    },
    lawNote: {
      en: "Follow the shrine administration's official visitor rules.",
      ar: "اتبع القواعد الرسمية لزوار الحرمين.",
    },
  },
  {
    govKey: "Ninawa",
    dress: {
      en: "Modest everyday dress; recovery areas may have dust — practical shoes.",
      ar: "لباس يومي متواضع؛ قد يكون في مناطق إعادة الإعمار غبار — حذاء عملي.",
    },
    photo: {
      en: "Ask before photographing reconstruction sites and residents.",
      ar: "اسأل قبل تصوير مواقع إعادة الإعمار والسكان.",
    },
    greetings: {
      en: "Mosul's Old City residents are welcoming; patience is appreciated in narrow lanes.",
      ar: "أهل مدينة الموصل القديمة مرحّبون؛ ويُقدَّر الترُّحّب في الأزقة الضيقة.",
    },
    markets: {
      en: "Al-Mashhad and old souqs: bargain politely.",
      ar: "المشهد والأسواق القديمة: تفاوض بأدب.",
    },
    lawNote: {
      en: "Some old-city areas are still under restoration — obey local closures.",
      ar: "بعض أحياء المدينة القديمة قيد الترميم — التزم بالإغلاقات المحلية.",
    },
  },
  {
    govKey: "Najaf",
    dress: {
      en: "Modest dress mandatory near the Imam Ali shrine; women's head covering required.",
      ar: "لباس متواضع إلزامي قرب حرم الإمام علي؛ وتغطية رأس النساء مطلوبة.",
    },
    photo: {
      en: "No photography inside shrine corridors unless posted otherwise.",
      ar: "لا تصوير داخل ممرات الحرم ما لم يُسمح باللافتات.",
    },
    greetings: {
      en: "Religious greetings customary; voices kept low near the shrine.",
      ar: "التحيات الدينية معتادة؛ وتُخفَّض الأصوات قرب الحرم.",
    },
    markets: {
      en: "Souq al-Ghazil near the shrine — agree prices.",
      ar: "سوق الغزل قرب الحرم — تفاوض على الأسعار.",
    },
    lawNote: {
      en: "Shrine-area security instructions are binding — follow officer guidance.",
      ar: "تعليمات أمن الحرم ملزمة — اتبع توجيهات القوات.",
    },
  },
  {
    govKey: "Erbil",
    dress: {
      en: "Modern city dress is fine; modest choices for religious visits (e.g., Lalish).",
      ar: "المدينة الحديثة تقبل اللباس العادي؛ واختر المتواضع للزيارات الدينية (مثل لاليش).",
    },
    photo: {
      en: "At Lalish, follow Yazidi religious site etiquette and staff guidance.",
      ar: "في لاليش، اتبع آداب الموقع الزيدي وتعليمات الموظفين.",
    },
    greetings: {
      en: "Kurdish and Arabic greetings both warm — 'Silav' / 'salam'.",
      ar: "التحيات الكردية والعربية ودودتان — «سلف» / «سلام».",
    },
    markets: {
      en: "Erbil bazaar: bargaining common; cafés busy evenings.",
      ar: "سوق أربيل: المساومة شائعة؛ والمقاهي مزدحمة مساءً.",
    },
    lawNote: {
      en: "Regional regulations differ from federal areas — check current guidance for the Kurdistan Region.",
      ar: "الأنظمة الإقليمية تختلف عن الاتحادية — تحقق من التوجيهات الحديثة في إقليم كردستان.",
    },
  },
];

export function cultureForGovernorate(enGov: string): CultureGuide | null {
  return CULTURE_GUIDES.find((g) => g.govKey.toLowerCase() === enGov.toLowerCase()) ?? null;
}
