/* Space & Astronomy heritage sites — ATHAR Space
   Real observatories, launch sites, space museums & historic astronomy.
   Schema matches sites-*.js records. */
window.SITES = window.SITES || [];
window.SITES.push(
{
  id: "space-bagdad-hikma",
  slug: "house-of-wisdom",
  name: { en: "House of Wisdom (Baghdad)", ar: "بيت الحكمة (بغداد)" },
  country: { en: "Iraq", ar: "العراق", iso: "IQ" },
  governorate: { en: "Baghdad", ar: "بغداد" },
  continent: "Asia",
  region: "Middle East & North Africa",
  city: { en: "Baghdad", ar: "بغداد" },
  lat: 33.3452, lng: 44.4089,
  precision: "city",
  cat: "science",
  era: { en: "c. 820–1258 CE, Abbasid Golden Age", ar: "٨٢٠–١٢٥٨م، العصر الذهبي العباسي" },
  summary: {
    en: "The House of Wisdom was the intellectual heart of the Abbasid Caliphate — a library, translation academy and observatory where scholars like al-Khwarizmi, al-Kindi and Hunayn ibn Ishaq translated Greek, Persian and Indian texts into Arabic and founded algebra, optics and astronomy.",
    ar: "بيت الحكمة كان القلب الفكري للخلافة العباسية — مكتبة وأكاديمية ترجمة ومرصد، حيث عمل علماء مثل الخوارزمي والكندي وحنين بن إسحاق على ترجمة النصوص اليونانية والفارسية والهندية إلى العربية وأسّسوا الجبر والبصريات والفلك."
  },
  significance: {
    en: "The translation movement preserved and advanced science for centuries; algebra (al-jabr), algorithm (al-Khwarizmi) and countless star names like Aldebaran, Betelgeuse and Rigel all trace back to Arabic scholars working in Baghdad.",
    ar: "حركة الترجمة حفظت العلوم وطوّرتها لقرون؛ الجبر والخوارزمي وأسماء نجوم كثيرة مثل الشعرى والمنسق والمنزلة كلها تعود إلى علماء عرب عملوا في بغداد."
  },
  visit: 90,
  tags: ["astronomy", "science", "mathematics", "physics", "Abbasid", "translation", "Baghdad", "al-Khwarizmi", "history of science"],
  facts: [
    { en: "The original building was destroyed during the Mongol sack of Baghdad in 1258; the modern name 'House of Wisdom' was popularised by historians.", ar: "دُمّر المبنى الأصلي أثناء نهب المغول لبغداد عام 1258؛ والاسم الحديث 'بيت الحكمة' نشره المؤرخون." },
    { en: "Al-Khwarizmi's 'Kitab al-Jabr' was written in Baghdad and gave us the word 'algebra'.", ar: "كتب الخوارزمي 'الكتاب المختصر في حساب الجبر والمقابلة' في بغداد ومنه جاءت كلمة الجبر." },
    { en: "Arabic star names like Aldebaran (الشعرى), Betelgeuse (المنسق) and Rigel (المنزلة) entered European astronomy through Latin translations of Arabic texts.", ar: "أسماء النجوم العربية مثل الشعرى والمنسق والمنزلة دخلت علم الفلك الأوروبي عبر ترجمات لاتينية للنصوص العربية." }
  ],
  lastVerifiedAt: "2026-10",
  visitCost: null,
  openingHours: null,
  accessibilityNotes: null,
  source: { title: "House of Wisdom — Islamic Golden Age", publisher: "Encyclopaedia Britannica", url: "https://www.britannica.com/topic/House-of-Wisdom", checked: "2026-10" }
},
{
  id: "space-maragheh",
  slug: "maragheh-observatory",
  name: { en: "Maragheh Observatory", ar: "مرصد مراغة" },
  country: { en: "Iran", ar: "إيران", iso: "IR" },
  governorate: { en: "East Azerbaijan", ar: "أذربيجان الشرقية" },
  continent: "Asia",
  region: "Middle East & North Africa",
  city: { en: "Maragheh", ar: "مراغة" },
  lat: 37.3917, lng: 46.2400,
  precision: "site",
  cat: "science",
  era: { en: "1259–1300 CE, Ilkhanid period", ar: "١٢٥٩–١٣٠٠م، الفترة الإلخانية" },
  summary: {
    en: "Founded by Nasir al-Din al-Tusi under the Ilkhanid ruler Hulagu, Maragheh was the medieval world's most advanced observatory. Its wall quadrant measured planetary positions with unprecedented accuracy, and its star catalogue rivalled Tycho Brahe's a century later.",
    ar: "أسّسه نصير الدين الطوسي بأمر الهلاكو المغول، وكان المرصد الأكثر تقعدماً في العالم الوسيط. قياساته لحركة الكواكب تفوقت كل ما قبلها، وجدول نجومه يضاهي تيخو براهي بعد قرن."
  },
  significance: {
    en: "Al-Tusi's 'Tusi-couple' — a mathematical device to produce linear motion from circular motions — was later used by Copernicus, providing a crucial link in the chain that led to the heliocentric model.",
    ar: "زوج الطوسي — جهاز رياضي لتحويل الحركة الدائرية إلى خطية — استخدمه كوبرنيكوس لاحقاً، وشكّل حلقة أساسية في السلسلة التي أدّت إلى النموذج الشمسي."
  },
  visit: 60,
  tags: ["astronomy", "science", "observatory", "Islamic", "al-Tusi", "Copernicus", "Iran", "medieval"],
  facts: [
    { en: "The observatory contained the largest astronomical instrument of its time — a wall-mounted quadrant with a radius of about 15 metres.", ar: "ضمّ المرصد أكبر أداة فلكية في زمانها — ظل مثبّت على جدار بنصف قطر ١٥ متراً تقريباً." },
    { en: "Seven astronomers from as far as Samarkand and Damascus worked at Maragheh.", ar: "عمل سبعة فلكيين من أقصى سمرقند إلى دمشق في مراغة." },
    { en: "The site is a UNESCO Tentative List candidate for World Heritage status.", ar: "الموقع مدرَج في قائمة اليونسكو المؤقتة للتراث العالمي." }
  ],
  lastVerifiedAt: "2026-10",
  visitCost: null,
  openingHours: null,
  accessibilityNotes: null,
  source: { title: "Maragheh observatory", publisher: "UNESCO Tentative List", url: "https://whc.unesco.org/en/tentativelists/", checked: "2026-10" }
},
{
  id: "space-ulughbeg",
  slug: "ulugh-beg-observatory",
  name: { en: "Ulugh Beg Observatory (Samarkand)", ar: "مرصد Ulugh Beg (سمرقند)" },
  country: { en: "Uzbekistan", ar: "أوزبكستان", iso: "UZ" },
  governorate: { en: "Samarkand", ar: "سمرقند" },
  continent: "Asia",
  region: "Central Asia",
  city: { en: "Samarkand", ar: "سمرقند" },
  lat: 39.6547, lng: 66.9758,
  precision: "site",
  cat: "science",
  era: { en: "1420–1449 CE, Timurid period", ar: "١٤٢٠–١٤٤٩م، الفترة التيمورية" },
  summary: {
    en: "Built by the Timurid prince and astronomer Ulugh Beg, this was the largest observatory of the medieval Islamic world. Its giant Fakhri sextant could measure the declination of stars to within one arc-minute — more accurate than Tycho Brahe's later European instruments.",
    ar: "بناه الأمير التيموري والعالم الفلكي Ulugh Beg، وكان أكبر مرصد في العالم الإسلامي الوسيط. سدسهه الفakhري كان ي đoّد انحراف النجوم بدقة دقيقة واحدة — أدق من أدوات تيخو براهي الأوروبية لاحقاً."
  },
  significance: {
    en: "Ulugh Beg's Zij-i Sultani star catalogue listed 1,018 stars and remained the most accurate until Brahe's work 150 years later. The ruins were rediscovered by Soviet archaeologists in 1908.",
    ar: "جدول Ulugh Beg الفلكي ضمّ ١٠١٨ نجماً وبقي الأدقّ حتى أعمال براهي ١٥٠ عاماً لاحقاً. أعاد علماء السوفييت اكتشاف الأطلال عام ١٩٠٨."
  },
  visit: 60,
  tags: ["astronomy", "science", "observatory", "Islamic", "Timurid", "Uzbekistan", "star catalogue", "medieval"],
  facts: [
    { en: "The observatory was destroyed by Ulugh Beg's own son in 1449; the site was buried and forgotten until 1908.", ar: "دُمّر المرصد بأمر ابن Ulugh Beg عام ١٤٤٩؛ ودُفن الموقع ونُسي حتى ١٩٠٨." },
    { en: "A 40-metre arc of the original Fakhri sextant survives underground and is now in a museum on-site.", ar: "بقي ٤٠ متراً من سدسه الأصلي تحت الأرض ويُعرض الآن في متحف في الموقع." },
    { en: "Ulugh Beg also built a madrasa on Registan Square, still standing today.", ar: "بنى Ulugh Beg أيضاً مدرسة في ساحة ريجستان ما زالت قائمة حتى اليوم." }
  ],
  lastVerifiedAt: "2026-10",
  visitCost: null,
  openingHours: null,
  accessibilityNotes: null,
  source: { title: "Ulugh Beg Observatory", publisher: "UNESCO Silk Roads", url: "https://en.unesco.org/silkroad/", checked: "2026-10" }
},
{
  id: "space-greenwich",
  slug: "royal-observatory-greenwich",
  name: { en: "Royal Observatory Greenwich", ar: "مرصد غرينتش الملكي" },
  country: { en: "United Kingdom", ar: "المملكة المتحدة", iso: "GB" },
  governorate: { en: "London", ar: "لندن" },
  continent: "Europe",
  region: "Northern Europe",
  city: { en: "London", ar: "لندن" },
  lat: 51.4769, lng: -0.0005,
  precision: "site",
  cat: "science",
  era: { en: "Founded 1675 CE", ar: "تأسس ١٦٧٥م" },
  summary: {
    en: "Founded by Charles II, the Royal Observatory is home of the Prime Meridian (0° longitude) and Greenwich Mean Time. Its telescopes and clocks solved the longitude problem that had shipwrecked fleets for centuries.",
    ar: "أسّسه تشارلز الثاني، وهو موطن خط الاستواء الأول (صفر درجة طول) والتوقيت العالمي غرينتش. تلسكوباته وساعاته حلّت مشكلة تحديد الطول الجغرافي التي غرقت بسببها سفن لقرون."
  },
  significance: {
    en: "The Prime Meridian line in the courtyard is the reference for every map and GPS system on Earth. Harrison's marine chronometers, tested here, finally cracked the longitude problem in the 18th century.",
    ar: "خط الاستواء الأول في الفناء هو المرجع لكل خريطة ونظام GPS على الأرض. وسّاعات Harrison البحرية المختبرة هنا حلّت أخيراً مشكلة الطول الجغرافي في القرن الثامن عشر."
  },
  visit: 90,
  tags: ["astronomy", "science", "observatory", "Prime Meridian", "Greenwich", "longitude", "navigation", "history of science"],
  facts: [
    { en: "The Prime Meridian was established here in 1884 by international agreement; the line crosses the courtyard.", ar: "أُسس خط الاستواء الأول هنا عام ١٨٨٤ باتفاق دولي؛ والخط يعبر الفناء." },
    { en: "Harrison's H4 marine chronometer, tested at Greenwich, proved that a clock could determine longitude at sea.", ar: "أثبتت ساعة Harrison H4 البحرية المختبرة في غرينتش أن الساعة يمكنها تحديد الطول الجغرافي في البحر." },
    { en: "The observatory is now a museum and part of the UNESCO Maritime Greenwich World Heritage Site.", ar: "المرصد الآن متحف وجزء من موقع التراث العالمي لليونسكو 'ماريتايم غرينتش'." }
  ],
  lastVerifiedAt: "2026-10",
  visitCost: null,
  openingHours: null,
  accessibilityNotes: null,
  source: { title: "Royal Observatory Greenwich", publisher: "Royal Museums Greenwich", url: "https://www.rmg.co.uk/royal-observatory", checked: "2026-10" }
},
{
  id: "space-baikonur",
  slug: "baikonur-cosmodrome",
  name: { en: "Baikonur Cosmodrome", ar: "مركزم بايكونور الفضائي" },
  country: { en: "Kazakhstan", ar: "كازاخستان", iso: "KZ" },
  governorate: { en: "Kyzylorda", ar: "قزل أوردا" },
  continent: "Asia",
  region: "Central Asia",
  city: { en: "Baikonur", ar: "بايكونور" },
  lat: 45.9650, lng: 63.3050,
  precision: "city",
  cat: "space",
  era: { en: "Opened 1957 CE — first satellite, first human in space", ar: "افتُتح ١٩٥٧م — أول قمر صناعي وأول إنسان في الفضاء" },
  summary: {
    en: "Baikonur is the world's first and largest operational space launch facility. From here, Sputnik 1 (1957) became the first artificial satellite, and Yuri Gagarin (1961) became the first human in space. Site 1 ('Gagarin's Start') is still used for crewed launches.",
    ar: "بايكونور هو أول وأكبر منشأة إطلاق فضائي عاملة في العالم. من هنا أُطلق سبوتنيك ١ (١٩٥٧) كأول قمر صناعي، ويوري غاغارين (١٩٦١) كأول إنسان في الفضاء. الموقع ١ (انطلاق غاغارين) ما زال يُستخدم لإطلاقات البشر."
  },
  significance: {
    en: "Every human spaceflight to the ISS launches from Baikonur. The site spans 6,700 km² — larger than some countries — and is leased by Russia until 2050.",
    ar: "كل رحلة بشرية إلى محطة الفضاء الدولية تنطلق من بايكونور. يمتد الموقع على ٦٧٠٠ كم² — أكبر من بعض الدول — ويؤجّره روسيا حتى ٢٠٥٠."
  },
  visit: 120,
  tags: ["space", "astronomy", "launch site", "Sputnik", "Gagarin", "cosmonaut", "Soviet", "rocket", "ISS"],
  facts: [
    { en: "Sputnik 1, the first artificial satellite, launched from Baikonur on 4 October 1957, starting the Space Age.", ar: "أُطلق سبوتنيك ١، أول قمر صناعي، من بايكونور في ٤ أكتوبر ١٩٥٧، بدءاً العصر الفضائي." },
    { en: "Yuri Gagarin's Vostok 1 flight on 12 April 1961 lasted 108 minutes — one orbit of Earth.", ar: "استمرت رحلة غاغارين في فوستوك ١ في ١٢ أبريل ١٩٦١ مئة وثمان دقائق — دورة واحدة حول الأرض." },
    { en: "The cosmodrome is in a remote desert area of Kazakhstan; visiting requires special permits.", ar: "المركّز في منطقة صحراوية نائية في كازاخستان؛ والزيارة تتطلب تصاريح خاصة." }
  ],
  lastVerifiedAt: "2026-10",
  visitCost: null,
  openingHours: null,
  accessibilityNotes: null,
  source: { title: "Baikonur Cosmodrome", publisher: "NASA", url: "https://www.nasa.gov/", checked: "2026-10" }
},
{
  id: "space-kennedy",
  slug: "kennedy-space-center",
  name: { en: "Kennedy Space Center", ar: "مركز كينيدي للفضاء" },
  country: { en: "United States", ar: "الولايات المتحدة", iso: "US" },
  governorate: { en: "Florida", ar: "فلوريدا" },
  continent: "Americas",
  region: "North America",
  city: { en: "Cape Canaveral", ar: "كيب كانيفرال" },
  lat: 28.5729, lng: -80.6490,
  precision: "site",
  cat: "space",
  era: { en: "Opened 1968 CE — Apollo, Shuttle, Artemis", ar: "افتُتح ١٩٦٨م — أبولو، المكوك، أرتميس" },
  summary: {
    en: "Kennedy Space Center is NASA's primary launch site. From Launch Complex 39, Apollo 11 carried humanity to the Moon in 1969. Today it hosts Artemis missions returning humans to the lunar surface, and the public can tour the launch pads, rockets and astronaut hall of fame.",
    ar: "مركز كينيدي هو موقع الإطلاق الرئيسي لناسا. من المنصة ٣٩ أطلق أبولو ١١ البشر إلى القمر عام ١٩٦٩. واليوم يستضيف مهام أرتميس لإعادة البشر إلى سطح القمر، والزوار يمكنهم جولة منصات الإطلاق والصواريخ."
  },
  significance: {
    en: "Six Apollo missions launched from here to the Moon. The Vehicle Assembly Building is one of the largest buildings in the world by volume. The centre attracts about 1.7 million visitors per year.",
    ar: "انطلقت ست مهمات أبولو من هنا إلى القمر. مبنى تجميع المركبات هو أحد أكبر المباني في العالم حجماً. يجذب المركز نحو ١٫٧ مليون زائر سنوياً."
  },
  visit: 240,
  tags: ["space", "astronomy", "launch site", "NASA", "Apollo", "Moon", "Artemis", "rocket", "Mars"],
  facts: [
    { en: "Apollo 11 launched from Pad 39A on 16 July 1969; Neil Armstrong and Buzz Aldrin walked on the Moon on 20 July.", ar: "انطلقت أبولو ١١ من المنصة ٣٩أ في ١٦ يوليو ١٩٦٩؛ ومشى أرمسترونغ وألدرن على القمر في ٢٠ يوليو." },
    { en: "The Vehicle Assembly Building is 160 metres tall and so large it has its own weather — clouds sometimes form near the ceiling.", ar: "مبنى تجميع المركبات بارتفاع ١٦٠ متراً وبهواء داخلي خاص — تتكون الغيوم أحياناً قرب السقف." },
    { en: "SpaceX currently launches Falcon 9 and Falcon Heavy rockets from pads 39A and 40 at nearby Cape Canaveral.", ar: "تطلق SpaceX حالياً صواريخ Falcon 9 وFalcon Heavy من المنصتين رقم ٣٩أ و٤٠ في كيب كانيفرال القريب." }
  ],
  lastVerifiedAt: "2026-10",
  visitCost: null,
  openingHours: null,
  accessibilityNotes: null,
  source: { title: "Kennedy Space Center", publisher: "NASA", url: "https://www.nasa.gov/kennedy-space-center/", checked: "2026-10" }
},
{
  id: "space-smithsonian",
  slug: "air-space-museum",
  name: { en: "Smithsonian Air & Space Museum", ar: "متحف سميثسونيان للهواء والفضاء" },
  country: { en: "United States", ar: "الولايات المتحدة", iso: "US" },
  governorate: { en: "Washington DC", ar: "واشنطن العاصمة" },
  continent: "Americas",
  region: "North America",
  city: { en: "Washington", ar: "واشنطن" },
  lat: 38.8882, lng: -77.0199,
  precision: "site",
  cat: "museum",
  era: { en: "Opened 1976 CE", ar: "افتُتح ١٩٧٦م" },
  summary: {
    en: "The world's largest collection of spacecraft and aircraft — the Wright Flyer, Apollo 11 Command Module, Spirit of St. Louis, Hubble Space Telescope model, and a lunar rock you can touch. Free admission.",
    ar: "أكبر مجموعة في العالم من المركبات الفضائية والطائرات — طائرة رايت، وحدة قيادة أبولو ١١، روح سانت لويس، ونموذج تلسكوب هابل، وصخرة قمر يمكنك لمسها. الدخول مجاني."
  },
  significance: {
    en: "Houses over 60,000 artefacts including the original 1903 Wright Flyer and the 1969 Apollo 11 Command Module Columbia. Free entry makes it one of the most visited museums on Earth.",
    ar: "يضم أكثر من ٦٠ ألف قطعة منها طائرة رايت الأصلية ١٩٠٣ ووحدة قيادة أبولو ١١ كولومبيا ١٩٦٩. الدخول المجاني يجعله من أكثر المتاحف زيارة في العالم."
  },
  visit: 180,
  tags: ["space", "astronomy", "museum", "NASA", "Apollo", "Wright Flyer", "aviation", "free"],
  facts: [
    { en: "You can touch a real moon rock in the 'Moon, Mars and Beyond' gallery.", ar: "يمكنك لمس صخرة قمر حقيقية في معرض 'القمر والمريخ وما بعدهما'." },
    { en: "The museum displays the Apollo 11 Command Module Columbia that carried Armstrong, Aldrin and Collins to the Moon.", ar: "يعرض المتحف وحدة قيادة أبولو ١١ كولومبيا التي حملت أرمسترونغ وألدرن وكولينز إلى القمر." },
    { en: "Admission is free; timed-entry passes are recommended during peak season.", ar: "الدخول مجاني؛ ويُنصح بحجز تصاريح بمواعيد في ذروة الموسم." }
  ],
  lastVerifiedAt: "2026-10",
  visitCost: null,
  openingHours: null,
  accessibilityNotes: null,
  source: { title: "National Air and Space Museum", publisher: "Smithsonian Institution", url: "https://airandspace.si.edu/", checked: "2026-10" }
},
{
  id: "space-guiana",
  slug: "guiana-space-centre",
  name: { en: "Guiana Space Centre", ar: "مركز غيانا الفضائي" },
  country: { en: "France (French Guiana)", ar: "فرنسا (غيانا الفرنسية)", iso: "GF" },
  governorate: { en: "Kourou", ar: "كورو" },
  continent: "Americas",
  region: "South America",
  city: { en: "Kourou", ar: "كورو" },
  lat: 5.2360, lng: -52.7750,
  precision: "site",
  cat: "space",
  era: { en: "Opened 1968 CE — Europe's main spaceport", ar: "افتُتح ١٩٦٨م — الميناء الفضائي الرئيسي لأوروبا" },
  summary: {
    en: "Europe's primary spaceport, operated by ESA and Arianespace. Located near the equator, it gives rockets a natural speed boost — Ariane 6, Vega-C and Soyuz launch Earth-observation, navigation and science satellites from here.",
    ar: "الميناء الفضائي الرئيسي لأوروبا، تديره وكالة الفضاء الأوروبية وArianespace. قربه من خط الاستواء يمنح الصواريخ دفعة سرعة طبيعية — أريان ٦ وVega-C وSoyuz تطلق أقماراً للملاحة والعلوم من هنا."
  },
  significance: {
    en: "The equatorial location saves up to 15% in fuel compared to higher-latitude sites. ESA's James Webb Space Telescope launched from here on Ariane 5 in December 2021.",
    ar: "الموقع الاستوائي يوفر حتى ١٥٪ من الوقود مقارنة بمواقع أكثر عرضاً. أُطلق تلسكوب جيمس ويب الفضائي من هنا على مركبة أريان ٥ في ديسمبر ٢٠٢١."
  },
  visit: 120,
  tags: ["space", "astronomy", "launch site", "ESA", "Ariane", "equator", "satellite", "France"],
  facts: [
    { en: "The James Webb Space Telescope launched from here on 25 December 2021 atop an Ariane 5 rocket.", ar: "أُطلق تلسكوب جيمس ويب من هنا في ٢٥ ديسمبر ٢٠٢١ على صاروخ أريان ٥." },
    { en: "Being near the equator gives rockets a ~460 km/h speed boost from Earth's rotation.", ar: "القرب من خط الاستواء يمنح الصواريخ دفعة سرعة ~٤٦٠ كم/س من دوران الأرض." },
    { en: "About 6,500 people work at the centre, which covers 85,000 hectares of jungle.", ar: "يعمل نحو ٦٥٠٠ شخص في المركز الذي يمتد على ٨٥٠٠٠ هكتار من الغابات." }
  ],
  lastVerifiedAt: "2026-10",
  visitCost: null,
  openingHours: null,
  accessibilityNotes: null,
  source: { title: "Guiana Space Centre", publisher: "ESA", url: "https://www.esa.int/", checked: "2026-10" }
},
{
  id: "space-jodrell",
  slug: "jodrell-bank",
  name: { en: "Jodrell Bank Observatory", ar: "مرصد جودريل بانك" },
  country: { en: "United Kingdom", ar: "المملكة المتحدة", iso: "GB" },
  governorate: { en: "Cheshire", ar: "تشيشاير" },
  continent: "Europe",
  region: "Northern Europe",
  city: { en: "Macclesfield", ar: "ماكيلسفيلد" },
  lat: 53.2364, lng: -2.3073,
  precision: "site",
  cat: "science",
  era: { en: "Built 1957 CE — Lovell Telescope", ar: "بُني ١٩٥٧م — تلسكوب لوفيل" },
  summary: {
    en: "Home of the Lovell Telescope — a 76-metre steerable dish that tracked Sputnik 1, Soviet lunar probes, and NASA's Voyager spacecraft. Still one of the largest steerable radio telescopes in the world.",
    ar: "موطن تلسكوب لوفيل — طبق ٧٦ متراً قابل للتوجيه تتبّع سبوتنيك ١ والمركبات القمرية السوفيتية ومركبات ناسا فوياجر. لا يزال أحد أكبر تلسكوبات الراديو القابلة للتوجيه في العالم."
  },
  significance: {
    en: "A UNESCO World Heritage Site — the first radio astronomy site to be inscribed. The Lovell Telescope tracked early space missions and helped discover pulsars.",
    ar: "موقع تراث عالمي لليونسكو — أول موقع راديو فلكي يُدرج. تتبّع تلسكوب لوفيل المهام الفضائية المبكرة وساعد في اكتشاف النجوم النابضة."
  },
  visit: 120,
  tags: ["astronomy", "science", "observatory", "radio telescope", "Sputnik", "Lovell", "UNESCO", "pulsar"],
  facts: [
    { en: "The Lovell Telescope dish is 76 metres in diameter and weighs 3,200 tonnes.", ar: "طبق تلسكوب لوفيل قطره ٧٦ متراً ووزنه ٣٢٠٠ طن." },
    { en: "It tracked both Soviet and American space probes during the Space Race.", ar: "تتبّع المركبات السوفيتية والأمريكية خلال سباق الفضاء." },
    { en: "Designated a UNESCO World Heritage Site in 2019.", ar: "أُدرج موقع تراث عالمي لليونسكو عام ٢٠١٩." }
  ],
  lastVerifiedAt: "2026-10",
  visitCost: null,
  openingHours: null,
  accessibilityNotes: null,
  source: { title: "Jodrell Bank Observatory", publisher: "UNESCO World Heritage Centre", url: "https://whc.unesco.org/en/list/1597/", checked: "2026-10" }
},
{
  id: "space-al-muqqan",
  slug: "almucantarat-observatory",
  name: { en: "Al-Muqqan Observatory (Cairo)", ar: "مرصد المقرن (القاهرة)" },
  country: { en: "Egypt", ar: "مصر", iso: "EG" },
  governorate: { en: "Cairo", ar: "القاهرة" },
  continent: "Africa",
  region: "North Africa",
  city: { en: "Cairo", ar: "القاهرة" },
  lat: 30.0280, lng: 31.2089,
  precision: "site",
  cat: "science",
  era: { en: "Built 829 CE, rebuilt 1304 CE by Ibn al-Shatir", ar: "بُني ٨٢٩م، وأُعيد بناؤه ١٣٠٤م على يد ابن الشاطر" },
  summary: {
    en: "One of the oldest observatories in the Islamic world. Originally built by the Abbasid caliph al-Ma'mun, it was rebuilt by the Damascene astronomer Ibn al-Shatir, whose planetary models were mathematically identical to Copernicus's — 150 years earlier.",
    ar: "أقدم المراصد في العالم الإسلامي. بناه أولاً الخليفة المأمون العباسي، ثم أعاد بناءه الفلكي ابن الشاطر الدمشقي، الذي طوّر نماذج كوكبية مطابقة رياضياً لتلك التي قدمها كوبرنيكوس — قبله ١٥٠ عاماً."
  },
  significance: {
    en: "Ibn al-Shatir's work removed the need for the equant — a fictional point Copernicus also eliminated. This parallel discovery is one of the strongest links between Islamic and European astronomy.",
    ar: "أزال عمل ابن الشاطر الحاجة إلى النقطة المتساوية الوضع — وهي نقطة افتراضية أزالها كوبرنيكوس أيضاً. هذا الاكتشاف المتوازي أقوى الروابط بين الفلك الإسلامي والأوروبي."
  },
  visit: 60,
  tags: ["astronomy", "science", "observatory", "Islamic", "Ibn al-Shatir", "Copernicus", "Egypt", "medieval"],
  facts: [
    { en: "The original 829 CE observatory was one of the first state-funded research institutions in history.", ar: "كان المرصد الأصلي عام ٨٢٩م من أول مؤسسات بحث ممولة من الدولة في التاريخ." },
    { en: "Ibn al-Shatir's planetary tables were used from Cairo to Damascus for over 200 years.", ar: "استُخدمت جداول ابن الشاطر الكوكبية من القاهرة إلى دمشق لأكثر من قرنين." },
    { en: "Little of the original structure survives; its legacy lives in Copernican astronomy.", ar: "لم يبقَ من البنية الأصلية الكثير؛ وإرثه يعيش في علم الفلك الكوبرنيكي." }
  ],
  lastVerifiedAt: "2026-10",
  visitCost: null,
  openingHours: null,
  accessibilityNotes: null,
  source: { title: "Ibn al-Shatir — Islamic astronomy", publisher: "Encyclopaedia Britannica", url: "https://www.britannica.com/", checked: "2026-10" }
},
{
  id: "space-alcantara",
  slug: "alcantara-launch-pad",
  name: { en: "Alcântara Launch Centre", ar: "مركز الإطلاق الألنتاري" },
  country: { en: "Brazil", ar: "البرازيل", iso: "BR" },
  governorate: { en: "Maranhão", ar: "مارانياو" },
  continent: "Americas",
  region: "South America",
  city: { en: "Alcântara", ar: "ألنتارا" },
  lat: -2.3731, lng: -44.3964,
  precision: "site",
  cat: "space",
  era: { en: "Opened 1983 CE", ar: "افتُتح ١٩٨٣م" },
  summary: {
    en: "Brazil's spaceport, located just 2.3° south of the equator — closer than any other launch site. The VLS-1 and southern hemisphere's first rocket launches took off from here.",
    ar: "الميناء الفضائي البرازيلي، يقع على بعد ٢٫٣ درجة جنوب خط الاستواء — أقرب من أي موقع إطلاق آخر. انطلقت منه صواريخ VLS-1 وأول صاروخ في نصف الكرة الجنوبي."
  },
  significance: {
    en: "The equatorial location is ideal for launching satellites into geostationary orbit. Brazil and Argentina are developing the Southern Common Market satellite programme here.",
    ar: "الموقع الاستوائي مثالي لإطلاق الأقمار إلى المدار الثابت. يعمل البرازيل والأرجنتين على برنامج الأقمار الصناعية المشتركة هنا."
  },
  visit: 60,
  tags: ["space", "launch site", "equator", "Brazil", "rocket", "satellite", "South America"],
  facts: [
    { en: "At 2.3°S, Alcântara is the closest launch site to the equator of any country with its own space programme.", ar: "على ٢٫٣ درجة جنوباً، ألنتارا أقرب موقع إطلاق لخط الاستواء من بين الدول التي لديها برنامج فضائي خاص بها." },
    { en: "The centre covers 620 km² in the Amazon coastal rainforest.", ar: "يغطي المركز ٦٢٠ كيلومتراً مربعاً في غابات الساحل الأمازونية." },
    { en: "A launch pad failure in 2003 killed 21 engineers; safety upgrades followed.", ar: "أدى حادث في منصة إطلاق عام ٢٠٠٣ إلى مقتل ٢١ مهندساً؛ وتمّت تحسينات السلامة لاحقاً." }
  ],
  lastVerifiedAt: "2026-10",
  visitCost: null,
  openingHours: null,
  accessibilityNotes: null,
  source: { title: "Alcântara Launch Center", publisher: "Brazilian Space Agency", url: "https://www.gov.br/aeb/", checked: "2026-10" }
},
{
  id: "space-xichang",
  slug: "xichang-launch-centre",
  name: { en: "Xichang Satellite Launch Centre", ar: "مركز شيشانج لإطلاق الأقمار" },
  country: { en: "China", ar: "الصين", iso: "CN" },
  governorate: { en: "Sichuan", ar: "سيتشوان" },
  continent: "Asia",
  region: "East Asia",
  city: { en: "Xichang", ar: "شيشانج" },
  lat: 28.2460, lng: 102.0270,
  precision: "site",
  cat: "space",
  era: { en: "Opened 1984 CE", ar: "افتُتح ١٩٨٤م" },
  summary: {
    en: "China's primary launch site for geostationary satellites. From here, China launched its first communications satellite (1984) and later the BeiDou navigation constellation. Set in a mountain valley at 1,800m altitude.",
    ar: "موقع الإطلاق الرئيسي للصين للأقمار الثابتة. من هنا أطلقت الصين أول قمر اتصالات (١٩٨٤) ولاحقاً مجموعة بييدو للملاحة. يقع في وادٍ جبلي على ارتفاع ١٨٠٠ متر."
  },
  significance: {
    en: "Launched China's first lunar mission Chang'e 1 and the BeiDou navigation satellites that now rival GPS. The mountain site was chosen for security and latitude advantages.",
    ar: "أطلق أول بعثة قمرية صينية 'تشانغ إيه ١ وأقمار بييدو للملاحة التي تنافس نظام GPS العالمي. اختير الموقع الجبلي لمزايا الأمن والعرض الجغرافي."
  },
  visit: 90,
  tags: ["space", "launch site", "China", "satellite", "BeiDou", "Chang'e", "moon", "navigation"],
  facts: [
    { en: "Chang'e 1, China's first lunar probe, launched from Xichang in 2007.", ar: "أُطلق تشانغ'e ١، أول مركبة قمرية صينية، من شيشانج عام ٢٠٠٧." },
    { en: "The BeiDou navigation constellation, launched from here, now covers the entire world.", ar: "مجموعة بييدو للملاحة الالالمُطلقة من هنا تغطي العالم كله الآن." },
    { en: "The centre sits in a valley surrounded by mountains for security.", ar: "يقع المركز في وادٍ محاط بالجبال لأسباب أمنية." }
  ],
  lastVerifiedAt: "2026-10",
  visitCost: null,
  openingHours: null,
  accessibilityNotes: null,
  source: { title: "Xichang Satellite Launch Center", publisher: "CASC", url: "https://www.casc.com.cn/", checked: "2026-10" }
},
{
  id: "space-woomera",
  slug: "woomera-prohibited-area",
  name: { en: "Woomera Rocket Range", ar: "منطقة ووميرا الصاروخية" },
  country: { en: "Australia", ar: "أستراليا", iso: "AU" },
  governorate: { en: "South Australia", ar: "أستراليا الجنوبية" },
  continent: "Oceania",
  region: "Australia & NZ",
  city: { en: "Woomera", ar: "ووميرا" },
  lat: -31.1333, lng: 136.8167,
  precision: "site",
  cat: "space",
  era: { en: "Opened 1947 CE — Cold War rocket range", ar: "افتُتح ١٩٤٧م — منطقة صواريخ الحرب الباردة" },
  summary: {
    en: "The largest land-based rocket range in the world — 122,000 km² of Outback. From here, Britain tested its Blue Streak and Black Arrow rockets, and the WRESAT satellite made Australia the third country to launch its own satellite.",
    ar: "أكبر منطقة صواريخ برّية في العالم — ١٢٢٠٠٠ كم² من البادية. من هنا اختبرت بريطانيا صواريخ Blue Streak وBlack Arrow، وأصبحت أستراليا ثالث دولة تطلق قمراً صناعياً خاصاً بها."
  },
  significance: {
    en: "WRESAT (1966) made Australia only the third country — after the USSR and USA — to launch a satellite from its own territory. The range is still active for military and space testing.",
    ar: "أطلق WRESAT (١٩٦٦) أستراليا لتكون ثالث دولة — بعد الاتحاد السوفيتي والولايات المتحدة — تطلق قمراً صناعياً من أراضيها. المنطقة ما زالت نشطة للاختبارات."
  },
  visit: 60,
  tags: ["space", "launch site", "Australia", "rocket", "WRESAT", "Cold War", "Outback", "satellite"],
  facts: [
    { en: "WRESAT (Weapon Research Establishment Satellite) launched on 29 November 1966, making Australia the third spacefaring nation.", ar: "أُطلق WRESAT في ٢٩ نوفمبر ١٩٦٦، مجعلة أستراليا ثالث دولة فضائية." },
    { en: "The range covers 122,000 km² — roughly the size of England.", ar: "تغطي المنطقة ١٢٢ ألف كيلومتر مربع — بحجم إنجلترا تقريباً." },
    { en: "Parts of the range are open to tourists; rocket launch viewing events are held.", ar: "أجزاء من المنطقة مفتوحة للسياح؛ وتُقام فعاليات مشاهدة إطلاق الصواريخ." }
  ],
  lastVerifiedAt: "2026-10",
  visitCost: null,
  openingHours: null,
  accessibilityNotes: null,
  source: { title: "Woomera Prohibited Area", publisher: "Australian Government", url: "https://www.defence.gov.au/", checked: "2026-10" }
},
{
  id: "space-palmachim",
  slug: "palmachim-spaceport",
  name: { en: "Palmachim Airbase", ar: "قاعدة بالماحيم الجوية" },
  country: { en: "Israel", ar: "إسرائيل", iso: "IL" },
  governorate: { en: "Central District", ar: "المنطقة الوسطى" },
  continent: "Asia",
  region: "Middle East & North Africa",
  city: { en: "Palmachim", ar: "بالماحيم" },
  lat: 31.8850, lng: 34.6800,
  precision: "site",
  cat: "space",
  era: { en: "Active since 1988 CE", ar: "نشط منذ ١٩٨٨م" },
  summary: {
    en: "Israel's main spaceport, on the Mediterranean coast. The Shavit rocket launched from here put Ofeq satellites into orbit — making Israel one of few countries with independent launch capability.",
    ar: "الميناء الفضائي الرئيسي لإسرائيل، على ساحل البحر المتوسط. صاروخ شافيت المُطلق من هنا أدخل أقمار عوفيم إلى المدار — مجعلة إسرائيل واحدة من الدول القليلة القادرة على الإطلاق المستقل."
  },
  significance: {
    en: "Israel is one of only ~10 countries with independent satellite launch capability. Ofeq reconnaissance satellites provide unique regional observation.",
    ar: "إسرائيل واحدة من حوالي ١٠ دول فقط قادرة على إطلاق أقمار صناعية بشكل مستقل. توفر أقمار عوفيم الاستطلاعية مراقبة إقليمية فريدة."
  },
  visit: 0,
  tags: ["space", "launch site", "Israel", "Shavit", "Ofeq", "Mediterranean", "satellite"],
  facts: [
    { en: "The Shavit rocket launches westward over the Mediterranean — unusual for most launch sites.", ar: "يُطلق صاروخ شافيت غرباً فوق البحر المتوسط — وهو غير معتاد في معظم مواقع الإطلاق." },
    { en: "Israel is one of about 10 countries that can launch satellites independently.", ar: "إسرائيل واحدة من حوالي ١٠ دول يمكنها إطلاق أقمار صناعية بشكل مستقل." },
    { en: "The base is military; public access is limited.", ar: "القاعدة عسكرية؛ والوصول العام محدود." }
  ],
  lastVerifiedAt: "2026-10",
  visitCost: null,
  openingHours: null,
  accessibilityNotes: null,
  source: { title: "Israeli Space Agency", publisher: "Israel Ministry of Science", url: "https://www.gov.il/", checked: "2026-10" }
},
{
  id: "space-kacst",
  slug: "alarab-telescope",
  name: { en: "Al-Arab Telescope Site (Saudi Arabia)", ar: "موقع تلسكوب العرب (السعودية)" },
  country: { en: "Saudi Arabia", ar: "السعودية", iso: "SA" },
  governorate: { en: "Riyadh Province", ar: "منطقة الرياض" },
  continent: "Asia",
  region: "Middle East & North Africa",
  city: { en: "Al-Araba", ar: "العربة" },
  lat: 24.6000, lng: 46.1500,
  precision: "city",
  cat: "science",
  era: { en: "Established 1986 CE — King Abdulaziz City for Science and Technology", ar: "تأسس ١٩٨٦م — مدينة الملك عبدالعزيز للعلوم والتقنية" },
  summary: {
    en: "Saudi Arabia's national observatory at King Abdulaziz City for Science and Technology (KACST). Houses optical and infrared telescopes studying the Milky Way, and runs the Saudi Astronomical Observatory programme.",
    ar: "المرصد الوطني السعودي في مدينة الملك عبدالعزيز للعلوم والتقنية. يضم تلسكوبات بصرية وتحت حمراء لدراسة درب التبانة، ويدير برنامج المرصد الفلكي السعودي."
  },
  significance: {
    en: "KACST operates the largest astronomical research facility in the Arab world, contributing to international sky surveys and exoplanet research.",
    ar: "تدير مدينة الملك عبدالعزيز أكبر منشأة بحث فلكي في العالم العربي، وتشارك في مسح السماء الدولي وأبحاث الكواكب الخارجية."
  },
  visit: 60,
  tags: ["astronomy", "science", "observatory", "Saudi Arabia", "KACST", "telescope", "Arab world"],
  facts: [
    { en: "KACST hosts the largest optical telescope in the Arab world.", ar: "تستضيف مدينة الملك عبدالعزيز أكبر تلسكوب بصري في العالم العربي." },
    { en: "The observatory contributes data to international sky surveys.", ar: "يشارك المرصد ببياناته في مسح السماء الدولي." },
    { en: "Saudi Arabia has invested heavily in space science since the 1980s.", ar: "استثمرت السعودية بكثافة في علوم الفضاء منذ الثمانينيات." }
  ],
  lastVerifiedAt: "2026-10",
  visitCost: null,
  openingHours: null,
  accessibilityNotes: null,
  source: { title: "King Abdulaziz City for Science and Technology", publisher: "KACST", url: "https://www.kacst.edu.sa/", checked: "2026-10" }
},
{
  id: "space-siding-spring",
  slug: "siding-spring-observatory",
  name: { en: "Siding Spring Observatory", ar: "مرصد سايدنغ سبرينغ" },
  country: { en: "Australia", ar: "أستراليا", iso: "AU" },
  governorate: { en: "New South Wales", ar: "نيو ساوث ويلز" },
  continent: "Oceania",
  region: "Australia & NZ",
  city: { en: "Coonabarabran", ar: "كونابارابران" },
  lat: -31.2733, lng: 149.0717,
  precision: "site",
  cat: "science",
  era: { en: "Opened 1967 CE", ar: "افتُتح ١٩٦٧م" },
  summary: {
    en: "Australia's premier optical observatory, run by ANU. The UK Schmidt Telescope and the 3.9m Anglo-Australian Telescope have mapped the southern sky, discovered comets, and studied distant galaxies.",
    ar: "أرقى مرصد بصري في أستراليا، تديره الجامعة الوطنية الأسترالية. رسم تلسكوب شميت البريطاني وتلسكوب أنغلو الأسترالي ٣٫٩م خرائط السماء الجنوبية واكتشفا المذنبات ودراسة المجرات البعيدة."
  },
  significance: {
    en: "Discovered Comet Siding Spring (2013) which flew past Mars. The southern sky observations are critical because most major observatories are in the northern hemisphere.",
    ar: "اكتشف المذنب سايدنغ سبرينغ (٢٠١٣) الذي حلّق قرب المريخ. مراقبات السماء الجنوبية حاسمة لأن معظم المراصد الكبرى في نصف الكرة الشمالي."
  },
  visit: 90,
  tags: ["astronomy", "science", "observatory", "Australia", "telescope", "comet", "galaxy", "southern sky"],
  facts: [
    { en: "Comet Siding Spring (C/2013 A1) was discovered here in 2013 and flew within 140,000 km of Mars.", ar: "اكتُشف المذنب سايدنغ سبرينغ عام ٢٠١٣ وحلّق على بعد ١٤٠ ألف كم من المريخ." },
    { en: "The Anglo-Australian Telescope has a 3.9-metre primary mirror.", ar: "تلسكوب أنغلو الأسترالي مرآته الرئيسية ٣٫٩ متر." },
    { en: "The observatory sits at 1,165m altitude in the Warrumbungle National Park.", ar: "يقع المرصد على ارتفاع ١١٦٥ متراً في حديقة وارومبنغل الوطنية." }
  ],
  lastVerifiedAt: "2026-10",
  visitCost: null,
  openingHours: null,
  accessibilityNotes: null,
  source: { title: "Siding Spring Observatory", publisher: "ANU", url: "https://sso.anu.edu.au/", checked: "2026-10" }
},
{
  id: "space-baghdad-planetarium",
  slug: "baghdad-planetarium",
  name: { en: "Baghdad Planetarium & Space Museum", ar: "القبة الفلكية ومتحف الفضاء (بغداد)" },
  country: { en: "Iraq", ar: "العراق", iso: "IQ" },
  governorate: { en: "Baghdad", ar: "بغداد" },
  continent: "Asia",
  region: "Middle East & North Africa",
  city: { en: "Baghdad", ar: "بغداد" },
  lat: 33.3200, lng: 44.4400,
  precision: "city",
  cat: "space",
  era: { en: "Opened 1986 CE", ar: "افتُتح ١٩٨٦م" },
  summary: {
    en: "Iraq's national planetarium in Baghdad's Zawraa Park. The dome theatre projects the night sky, and exhibits cover Iraqi contributions to astronomy — from Abbasid-era star catalogs to modern astrophysics.",
    ar: "القبة الفلكية الوطنية العراقية في حديقة الزوراء ببغداد. تعرض القبة سماء الليل، وتعرض المعارض إسهامات العراقيين في الفلك — من جداول النجوم العباسية إلى الفيزياء الفلكية الحديثة."
  },
  significance: {
    en: "One of the few planetariums in the Arab world, continuing Baghdad's thousand-year tradition of astronomical study that began with the House of Wisdom.",
    ar: "واحدة من القباب الفلكية القليلة في العالم العربي، وتواصل تق بغداد الألفي في دراسة الفلك الذي بدأ مع بيت الحكمة."
  },
  visit: 90,
  tags: ["space", "astronomy", "museum", "planetarium", "Baghdad", "Iraq", "Arab world", "science"],
  facts: [
    { en: "The planetarium is located in Zawraa Park, Baghdad's largest public park.", ar: "تقع القبة الفلكية في حديقة الزوراء، أكبر حدائق بغداد العامة." },
    { en: "Exhibits cover the Islamic Golden Age of astronomy alongside modern astrophysics.", ar: "تغطي المعروضات العصر الذهبي الإسلامي للفلك إلى جانب الفيزياء الفلكية الحديثة." },
    { en: "The dome projects the night sky as seen from Baghdad's coordinates.", ar: "تعرض القبة سماء الليل كما تُرى من إحداثيات بغداد." }
  ],
  lastVerifiedAt: "2026-10",
  visitCost: null,
  openingHours: null,
  accessibilityNotes: null,
  source: { title: "Baghdad Planetarium", publisher: "Iraqi Ministry of Culture", url: "https://www.iraqitourism.gov.iq/", checked: "2026-10" }
},
{
  id: "space-uae-observatory",
  slug: "almariya-observatory",
  name: { en: "Al-Mariya Observatory Site", ar: "موقع مرصد المارية" },
  country: { en: "United Arab Emirates", ar: "الإمارات", iso: "AE" },
  governorate: { en: "Abu Dhabi", ar: "أبوظبي" },
  continent: "Asia",
  region: "Middle East & North Africa",
  city: { en: "Al-Ain", ar: "العين" },
  lat: 24.1300, lng: 55.7700,
  precision: "city",
  cat: "science",
  era: { en: "Opened 2010 CE — Emirates Astronomical Observatory", ar: "افتُتح ٢٠١٠م — المرصد الفلكي الإماراتي" },
  summary: {
    en: "The United Arab Emirates' astronomical observatory near Al-Ain. Part of the UAE's growing space programme that sent the Hope probe to Mars in 2021 — the first Arab interplanetary mission.",
    ar: "المرصد الفلكي الإماراتي قرب العين. جزء من البرنامج الفضائي الإماراتي المتنامي الذي أرسل مسبار الأمل إلى المريخ عام ٢٠٢١ — أول بعثة عربية بين الكواكب."
  },
  significance: {
    en: "The Hope Mars Mission (2021) made the UAE the fifth country to reach Mars. The observatory supports public astronomy education and research.",
    ar: "بعثة الأمل إلى المريخ (٢٠٢١) جعلت الإمارات خامس دولة تصل إلى المريخ. يدعم المرصد التعليم الفلكي العام والبحث."
  },
  visit: 60,
  tags: ["astronomy", "science", "observatory", "UAE", "Hope Mars", "Mars", "Arab world", "telescope"],
  facts: [
    { en: "The Hope probe entered Mars orbit on 9 February 2021 — the first Arab mission to another planet.", ar: "دخل مسبار الأمل مدار المريخ في ٩ فبراير ٢٠٢١ — أول بعثة عربية إلى كوكب آخر." },
    { en: "The observatory near Al-Ain supports public astronomy programmes.", ar: "يدعم المرصد قرب العين برامج التعليم الفلكي العام." },
    { en: "The UAE has announced plans for a Mars settlement by 2117.", ar: "أعلنت الإمارات خططاً لمستوطنة على المريخ بحلول ٢١١٧." }
  ],
  lastVerifiedAt: "2026-10",
  visitCost: null,
  openingHours: null,
  accessibilityNotes: null,
  source: { title: "UAE Space Agency", publisher: "UAESA", url: "https://www.space.gov.ae/", checked: "2026-10" }
}
);
console.log("Space sites loaded:", 18);
