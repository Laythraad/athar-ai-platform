/* ATHAR Kids — curated bilingual stories + quizzes.
   Safe, static content: no user-generated data reaches children, nothing is
   published automatically, and no personal data is collected. */

export interface KidsStory {
  id: string;
  title: { en: string; ar: string };
  text: { en: string; ar: string };
  ageRange: string;
  question: { en: string; ar: string };
  choices: { en: string[]; ar: string[] };
  answerIndex: number;
  source: string;
}

export const KIDS_STORIES: KidsStory[] = [
  {
    id: "ziggurat",
    title: { en: "The Great Ziggurat", ar: "المدرج الكبير" },
    text: {
      en: "Long ago in Ur, builders stacked millions of mud bricks into a huge staircase to the sky. It was called a ziggurat. Families left gifts of grain and dates. Today you can still visit the restored steps and imagine the builders singing as they worked.",
      ar: "قبل زمن طويل في أور، بنى العمال ملايين الطوب في سلّم ضخم يصل إلى السماء. سُمّي المدرّج. تركت العائلات هدايا من القمر والتمر. واليوم يمكنك زيارة الدرج المرمّم وتخيل العاملين وهم يغنون أثناء عملهم.",
    },
    ageRange: "6-10",
    question: { en: "What material did the builders use?", ar: "ما المادة التي استخدمها البناؤون؟" },
    choices: {
      en: ["Mud bricks", "Glass", "Iron"],
      ar: ["الطوب الطيني", "الزجاج", "الحديد"],
    },
    answerIndex: 0,
    source: "Sourced from the ATHAR Iraq dataset (iq-ur-ziggurat).",
  },
  {
    id: "marshes",
    title: { en: "The Marsh Dwellers", ar: "أهل الأهوار" },
    text: {
      en: "In southern Iraq, water birds glide between tall reeds. Families build houses from reeds and sail in narrow boats called mashoof. They fish, grow rice, and tell stories at sunset. The marshes are a UNESCO World Heritage place.",
      ar: "في جنوب العراق، تسير الطيور المائية بين القصب العالي. تبني العائلات بيوتاً من القصب وتبحر بقوارب ضيقة تُسمى المشاحف. يصطادون ويزرعون الأرز ويروون الحكايات عند الغروب. الأهوار مُدرَج في قائمة التراث العالمي.",
    },
    ageRange: "7-11",
    question: { en: "What is the narrow boat called?", ar: "ما اسم القارب الضيق؟" },
    choices: {
      en: ["Mashoof", "Ferry", "Canoe"],
      ar: ["المشحوف", "عبّارة", "زورق"],
    },
    answerIndex: 0,
    source: "Sourced from the ATHAR Iraq dataset (iq-marshes).",
  },
  {
    id: "ishtar",
    title: { en: "The Blue Gate", ar: "البوابة الزرقاء" },
    text: {
      en: "King Nebuchadnezzar built a gate in Babylon covered with blue glazed bricks. Lions and dragons danced across it in yellow and white. Imagine walking through that gate 2,600 years ago — the colours were even brighter in the sun.",
      ar: "بنى الملك نبوخذنصر بوابة في بابل مغطاة بآجر أزرق لامق. تراقصت الأسود والتنينات عليها بالأصفر والأبيض. تخيّل أن تمشي عبر تلك البوابة قبل 2600 سنة — كانت الألوان ألمع في الشمس.",
    },
    ageRange: "6-10",
    question: { en: "Who built the Blue Gate?", ar: "من بنى البوابة الزرقاء؟" },
    choices: {
      en: ["Nebuchadnezzar", "Alexander", "Hammurabi"],
      ar: ["نبوخذنصر", "الإسكندر", "حمورابي"],
    },
    answerIndex: 0,
    source: "Sourced from the ATHAR Iraq dataset (iq-babylon).",
  },
];

export interface KidsQuiz {
  id: string;
  question: { en: string; ar: string };
  choices: { en: string[]; ar: string[] };
  answerIndex: number;
  source: string;
}

export const KIDS_QUIZZES: KidsQuiz[] = [
  {
    id: "q-mesopotamia",
    question: { en: "Which country is the Tigris river in?", ar: "في أي نهر دجلة؟" },
    choices: { en: ["Iraq", "Brazil", "Norway"], ar: ["العراق", "البرازيل", "النرويج"] },
    answerIndex: 0,
    source: "ATHAR geography dataset.",
  },
  {
    id: "q-museum",
    question: {
      en: "Which Baghdad museum keeps Iraq's national antiquities?",
      ar: "أي متحف في بغداد يحفظ آثار العراق الوطنية؟",
    },
    choices: {
      en: ["Iraq Museum", "Louvre", "British Museum"],
      ar: ["المتحف العراقي", "اللوفر", "المتحف البريطاني"],
    },
    answerIndex: 0,
    source: "Sourced from the ATHAR Iraq dataset (iq-national-museum).",
  },
];
