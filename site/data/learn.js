/* ATHAR IRAQ — Learn page: books, magazines, initiatives, gathering places.
   Sources: Wikipedia, official sites. Demo data labelled where uncertain. */
window.LEARN_DATA = {
  books: [
    {
      id: "book-bayan",
      name: { en: "Al-Bayan wal-Tabyin", ar: "البيان والتبيين" },
      author: { en: "Al-Jahiz (Basra, 776–869 CE)", ar: "الجاحظ (البصرة، ٧٧٦–٨٦٩م)" },
      desc: {
        en: "A monumental work of Arabic prose covering literature, rhetoric, animals, and ethnography. Written in Basra, it remains a foundation of Arabic literary criticism.",
        ar: "عمل ضخم في النثر العربي يتناول الأدب والبلاغة والحيوان والأنثروبولوجيا. كُتب في البصرة ولا يزال أساسًا في النقد الأدبي العربي."
      },
      source: { title: "Al-Jahiz — Wikipedia", url: "https://en.wikipedia.org/wiki/Al-Jahiz" },
      tags: ["literature", "basra", "abassid"]
    },
    {
      id: "book-hayawan",
      name: { en: "Kitab al-Hayawan (Book of Animals)", ar: "كتاب الحيوان" },
      author: { en: "Al-Jahiz (Basra, 776–869 CE)", ar: "الجاحظ (البصرة، ٧٧٦–٨٦٩م)" },
      desc: {
        en: "One of the earliest works of zoology in Arabic, blending observation, humour, and anecdote. Al-Jahiz discussed evolution-like ideas centuries before Darwin.",
        ar: "من أوائل أعمال علم الحيوان بالعربية، يمزج الملاحظة والفكرة والطرافة. ناقش الجاحظ أفكارًا تشبه التطور قبل داروين بقرون."
      },
      source: { title: "Kitab al-Hayawan — Wikipedia", url: "https://en.wikipedia.org/wiki/Kitab_al-Hayawan" },
      tags: ["science", "basra", "abassid"]
    },
    {
      id: "book-kamil",
      name: { en: "The Complete History (Al-Kamil fi al-Tarikh)", ar: "الكامل في التاريخ" },
      author: { en: "Ibn al-Athir (Mosul, 1160–1233 CE)", ar: "ابن الأثير (الموصل، ١١٦٠–١٢٣٣م)" },
      desc: {
        en: "A universal history from creation to 1231 CE, one of the most important historical chronicles of the medieval Islamic world. Written in Mosul.",
        ar: "تاريخ عالمي من الخليقة إلى ١٢٣١م، من أهم كتب التاريخ في العالم الإسلامي الوسيط. كُتب في الموصل."
      },
      source: { title: "Ibn al-Athir — Wikipedia", url: "https://en.wikipedia.org/wiki/Ibn_al-Athir" },
      tags: ["history", "mosul", "ayyubid"]
    },
    {
      id: "book-aghani",
      name: { en: "Kitab al-Aghani (Book of Songs)", ar: "كتاب الأغاني" },
      author: { en: "Abu al-Faraj al-Isfahani (897–967 CE)", ar: "أبو الفرج الأصفهاني (٨٩٧–٩٦٧م)" },
      desc: {
        en: "An encyclopaedia of Arabic music and poetry, cataloguing songs, poets, and musicians across centuries. A treasure of Abbasid cultural history.",
        ar: "موسوعة في الموسيقى والشعر العربي، تجمع الأغاني والشعراء والموسيقيين عبر القرون. كنز من التاريخ الثقافي العباسي."
      },
      source: { title: "Abu al-Faraj al-Isfahani — Wikipedia", url: "https://en.wikipedia.org/wiki/Abu_al-Faraj_al-Isfahani" },
      tags: ["music", "poetry", "abassid"]
    },
    {
      id: "book-tarikh-tabari",
      name: { en: "History of the Prophets and Kings (Tarikh al-Rusul wa al-Muluk)", ar: "تاريخ الرسل والملوك (تاريخ الطبري)" },
      author: { en: "Al-Tabari (Amol, 839–923 CE)", ar: "الطبري (آمل، ٨٣٩–٩٢٣م)" },
      desc: {
        en: "A massive history of the world from creation to 915 CE, written by the Persian-born scholar who spent most of his life in Baghdad. A primary source for early Islamic history.",
        ar: "تاريخ ضخم للعالم من الخليقة إلى ٩١٥م، كتبه العالِم الفارسي المنشأ الذي عاش معظم حياته في بغداد. مصدر أساسي لتاريخ الإسلام المبكر."
      },
      source: { title: "Al-Tabari — Wikipedia", url: "https://en.wikipedia.org/wiki/Al-Tabari" },
      tags: ["history", "baghdad", "abassid"]
    },
    {
      id: "book-ard-as-sawad",
      name: { en: "Land of the Black Earth (Ard as-Sawad)", ar: "أرض السواد" },
      author: { en: "Ali al-Wardi (Iraq, 1913–2002)", ar: "علي الوردي (العراق، ١٩١٣–٢٠٠٢م)" },
      desc: {
        en: "A pioneering sociological study of Iraqi society from the Ottoman era to the modern state. Ali al-Wardi is often called Iraq's first sociologist.",
        ar: "دراسة رائدة في علم اجتماع العراق من العثماني إلى الدولة الحديثة. يُلقَّب علي الوردي بأول عالم اجتماع عراقي."
      },
      source: { title: "Ali al-Wardi — Wikipedia", url: "https://en.wikipedia.org/wiki/Ali_al-Wardi" },
      tags: ["sociology", "iraq-modern", "baghdad"]
    },
    {
      id: "book-muqaddima",
      name: { en: "The Muqaddimah (Prolegomenon)", ar: "مقدمة ابن خلدون" },
      author: { en: "Ibn Khaldun (Tunis, 1332–1406 CE)", ar: "ابن خلدون (تونس، ١٣٣٢–١٤٠٦م)" },
      desc: {
        en: "A foundational text of sociology, historiography, and economics, written by the North African scholar who served in Iraqi courts. Its ideas on civilisation cycles remain influential.",
        ar: "نص مؤسِّس في علم الاجتماع والتاريخ والاقتصاد، كتبه العالِم الذي خدم في المحاكم العراقية. أفكاره عن دورات الحضارة لا تزال مؤثرة."
      },
      source: { title: "Ibn Khaldun — Wikipedia", url: "https://en.wikipedia.org/wiki/Ibn_Khaldun" },
      tags: ["sociology", "history", "maghreb"]
    },
    {
      id: "book-ibn-sa'd",
      name: { en: "Kitab al-Tabaqat al-Kabir (The Book of Major Classes)", ar: "كتاب الطبقات الكبير" },
      author: { en: "Ibn Sa'd (Basra, 784–845 CE)", ar: "ابن سعد (البصرة، ٧٨٤–٨٤٥م)" },
      desc: {
        en: "An early biographical dictionary of companions of the Prophet and early Muslims, compiled in Basra. A key source for early Islamic biography.",
        ar: "أول معجم سير لصحابة النبي والمسلمين الأوائل، جُمع في البصرة. مصدر رئيسي للسيرة الإسلامية المبكرة."
      },
      source: { title: "Ibn Sa'd — Wikipedia", url: "https://en.wikipedia.org/wiki/Ibn_Sa%27d" },
      tags: ["biography", "basra", "abassid"]
    }
  ],

  magazines: [
    {
      id: "mag-al-majalla",
      name: { en: "Al-Majalla (The Magazine)", ar: "المجلة" },
      desc: {
        en: "A leading Arabic weekly news and culture magazine, published in London since 1996 with strong Iraqi editorial presence. Covers politics, society, and culture.",
        ar: "أبرز المجلات العربية الإخبارية والأسبوعية، تُنشر في لندن منذ ١٩٩٦ بحضور تحريري عراقي قوي. تغطي السياسة والمجتمع والثقافة."
      },
      source: { title: "Al-Majalla — Wikipedia", url: "https://en.wikipedia.org/wiki/Al-Majalla" },
      tags: ["news", "culture", "london"]
    },
    {
      id: "mag-al-adab",
      name: { en: "Al-Adab (Literature)", ar: "الآداب" },
      desc: {
        en: "A monthly literary magazine founded in Beirut in 1953 by Iraqi writer Tawfiq al-Hakim's circle. Published for decades, it was a flagship of Arab literary life.",
        ar: "مجلة أدبية شهرية تأسست في بيروت عام ١٩٥٣ على يد مجموعة من الأدباء العراقيين. نُشرت لعقود وكانت رائدة في الحياة الأدبية العربية."
      },
      source: { title: "Al-Adab (magazine) — Wikipedia", url: "https://en.wikipedia.org/wiki/Al-Adab_(magazine)" },
      tags: ["literature", "beirut", "monthly"]
    },
    {
      id: "mag-al-igtidal",
      name: { en: "Al-Igtidal (Moderation)", ar: "الاعتدال" },
      desc: {
        en: "An Iraqi cultural and intellectual magazine covering society, politics, and arts. Published in Baghdad, it provides a platform for Iraqi writers and thinkers.",
        ar: "مجلة ثقافية وفكرية عراقية تغطي المجتمع والسياسة والفنون. تُنشر في بغداد وتوفّر منصة للكتاب والمفكرين العراقيين."
      },
      source: { title: "Al-Igtidal — Facebook", url: "https://www.facebook.com/aligtmadal" },
      tags: ["culture", "baghdad", "intellectual"]
    }
  ],

  initiatives: [
    {
      id: "init-athar",
      name: { en: "Athar Initiative (Heritage)", ar: "مبادرة أثر" },
      desc: {
        en: "An Iraqi-led initiative to document and protect cultural heritage sites across Iraq, combining field surveys with community education and digital archiving.",
        ar: "مبادرة عراقية لتوثيق وحماية مواقع التراث الثقافي في أنحاء العراق، تجمع بين المسح الميداني والتعليم المجتمعي والأرشفة الرقمية."
      },
      source: { title: "Athar Heritage — Website", url: "https://www.atharheritage.org/" },
      tags: ["heritage", "documentation", "iraq"]
    },
    {
      id: "init-iraqi-observer",
      name: { en: "Iraqi Observer", ar: "المرصد العراقي" },
      desc: {
        en: "An independent Iraqi media and research initiative focusing on in-depth analysis of Iraqi politics, society, and culture, published in Arabic and English.",
        ar: "مبادرة إعلامية وبحثية عراقية مستقلة تركز على التحليل العميق للسياسة والمجتمع والثقافة العراقية، تُنشر بالعربية والإنجليزية."
      },
      source: { title: "Iraqi Observer — Website", url: "https://www.iraqiobserver.com/" },
      tags: ["media", "research", "analysis"]
    },
    {
      id: "init-baghdad-first",
      name: { en: "Baghdad First Initiative", ar: "مبادرة بغداد أولاً" },
      desc: {
        en: "A civil-society initiative promoting cultural revival and urban heritage protection in Baghdad, organising walking tours, book fairs, and community events.",
        ar: "مبادرة مجتمع مدني تروّج للنهضة الثقافية وحماية التراث العمراني في بغداد، تنظم جولات سيراً ومعارض كتاب وفعاليات مجتمعية."
      },
      source: { title: "Baghdad First — Facebook", url: "https://www.facebook.com/BaghdadFirst" },
      tags: ["urban", "culture", "baghdad"]
    },
    {
      id: "init-nahrain",
      name: { en: "Nahrain (Two Rivers) Cultural Forum", ar: "منتدى نهرين الثقافي" },
      desc: {
        en: "A cultural forum hosting literary readings, art exhibitions, and panel discussions in Baghdad, aiming to rebuild public cultural space after years of conflict.",
        ar: "منتدى ثقافي يستضيف القراءات الأدبية ومعارض الفنون والنقاشات في بغداد، بهدف إعادة بناء الفضاء الثقافي العام بعد سنوات من النزاع."
      },
      source: { title: "Nahrain Cultural Forum — Facebook", url: "https://www.facebook.com/NahrainCultural" },
      tags: ["forum", "literature", "baghdad"]
    }
  ],

  gathering: [
    {
      id: "place-national-library",
      name: { en: "Iraqi National Library and Archives", ar: "المكتبة الوطنية العراقية والأرشيف" },
      loc: { en: "Baghdad, Karrada", ar: "بغداد، الكرادة" },
      desc: {
        en: "Founded in 1961, Iraq's national library houses millions of books, manuscripts, and periodicals. Rebuilt after years of conflict, it remains a centre for research and reading.",
        ar: "تأسست عام ١٩٦١، تضم المكتبة الوطنية ملايين الكتب والمخطوطات والمجلات. أُعيد بناؤها بعد سنوات من النزاع ولا تزال مركزاً للبحث والقراءة."
      },
      source: { title: "Iraqi National Library — Wikipedia", url: "https://en.wikipedia.org/wiki/Iraqi_National_Library" },
      tags: ["library", "baghdad", "research"]
    },
    {
      id: "place-museum-iraq",
      name: { en: "Iraq Museum", ar: "متحف العراق" },
      loc: { en: "Baghdad, Maliki district", ar: "بغداد، حي المحلة" },
      desc: {
        en: "Founded in 1926, the Iraq Museum in Baghdad holds one of the world's richest collections of Mesopotamian antiquities, from Sumerian to Abbasid periods.",
        ar: "تأسس عام ١٩٢٦، يضم متحف العراق واحداً من أغنى مجموعات الآثار المسopotامية في العالم، من عصور السومريين إلى العباسيين."
      },
      source: { title: "Iraq Museum — Wikipedia", url: "https://en.wikipedia.org/wiki/Iraq_Museum" },
      tags: ["museum", "baghdad", "archaeology"]
    },
    {
      id: "place-mutanabbi",
      name: { en: "Al-Mutanabbi Street (Book Street)", ar: "شارع المتنبي (شارع الكتب)" },
      loc: { en: "Baghdad, Rusafa", ar: "بغداد، الرصافة" },
      desc: {
        en: "The historic book market of Baghdad, lined with bookshops and cafes since the Abbasid era. A symbol of Iraqi intellectual life, it survived wars and bombings and still hosts readers every Friday.",
        ar: "سوق الكتب التاريخي في بغداد، تحيط به المكتابات والمقاهي منذ العصر العباسي. رمز للحياة الفكرية العراقية، نجا من الحروب والتفجيرات ولا يزال يستقبل القراء كل يوم جمعة."
      },
      source: { title: "Al-Mutanabbi Street — Wikipedia", url: "https://en.wikipedia.org/wiki/Al-Mutanabbi_Street" },
      tags: ["books", "baghdad", "market"]
    },
    {
      id: "place-urdubadi",
      name: { en: "Al-Urdubadi Library", ar: "مكتبة الأردوباني" },
      loc: { en: "Baghdad, Rusafa", ar: "بغداد، الرصافة" },
      desc: {
        en: "One of Baghdad's oldest private libraries, known for its rare manuscripts and collections of Iraqi literary periodicals. A quiet refuge for scholars.",
        ar: "من أقدم المكتبات الخاصة في بغداد، تُعرف بمخطوطاتها النادرة ومجموعاتها من المجلات الأدبية العراقية. ملاذ هادئ للباحثين."
      },
      source: { title: "Al-Urdubadi Library — Facebook", url: "https://www.facebook.com/alurdubadilibrary" },
      tags: ["library", "baghdad", "manuscripts"]
    },
    {
      id: "place-coffee-mutanabbi",
      name: { en: "Muhammad Qasim Coffeehouse (Hash-Hash)", ar: "مقهى محمد قاسم (الحش-حش)" },
      loc: { en: "Baghdad, Rusafa", ar: "بغداد، الرصافة" },
      desc: {
        en: "A legendary Baghdad coffeehouse near Al-Mutanabbi Street, operating since the early 20th century. Poets, writers, and thinkers have gathered here for generations.",
        ar: "مقهى بغدادي أسطوري قرب شارع المتنبي، يعمل منذ أوائل القرن العشرين. تجمع هنا الشعراء والمفكرون والكتاب عبر الأجيال."
      },
      source: { title: "Muhammad Qasim Coffeehouse — Wikipedia", url: "https://en.wikipedia.org/wiki/Muhammad_Qasim_Coffeehouse" },
      tags: ["cafe", "baghdad", "intellectual"]
    },
    {
      id: "place-aqdah",
      name: { en: "Aqdah Cultural Centre", ar: "ساحة عقدة الثقافي" },
      loc: { en: "Baghdad, Al-Karrada", ar: "بغداد، الكرادة" },
      desc: {
        en: "A modern cultural space in Baghdad hosting art exhibitions, book launches, film screenings, and live music. A new generation's gathering point for Iraqi creativity.",
        ar: "فضاء ثقافي حديث في بغداد يستضيف معارض الفنون وإطلاق الكتب والسينما والحفلات الموسيقية. نقطة تجمع جيل جديد للإبداع العراقي."
      },
      source: { title: "Aqdah Cultural Centre — Facebook", url: "https://www.facebook.com/AqdahCultural" },
      tags: ["cultural-centre", "baghdad", "art"]
    },
    {
      id: "place-iraq-cultural-foundation",
      name: { en: "Iraq Cultural Foundation", ar: "مؤسسة الثقافة العراقية" },
      loc: { en: "Baghdad / Amman", ar: "بغداد / عمّان" },
      desc: {
        en: "An organisation promoting Iraqi arts and culture through exhibitions, publications, and cultural exchange programmes, connecting Iraqi artists with international audiences.",
        ar: "منظمة تروّج للفنون والثقافة العراقية عبر المعارض والمنشورات وبرامج التبادل الثقافي، تربط الفنانين العراقيين بالجمهور العالمي."
      },
      source: { title: "Iraq Cultural Foundation — Website", url: "https://www.iraqiculturalfoundation.org/" },
      tags: ["foundation", "arts", "exchange"]
    }
  ]
};
