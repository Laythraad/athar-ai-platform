/* ATHAR Travel — airports directory (sourced, no invented flights).
   Data: official airport identifiers + public facts. Official website links
   only where a stable official domain is known. Live flight data is NOT
   provided — users are directed to official sources. */

export interface Airport {
  iata: string;
  icao: string;
  name: { en: string; ar: string };
  city: { en: string; ar: string };
  country: { en: string; ar: string; iso: string };
  lat: number;
  lng: number;
  officialUrl: string | null;
  transportNote: { en: string; ar: string } | null;
  source: string;
  checked: string;
}

export const AIRPORTS: Airport[] = [
  {
    iata: "BGW",
    icao: "ORBI",
    name: { en: "Baghdad International Airport", ar: "مطار بغداد الدولي" },
    city: { en: "Baghdad", ar: "بغداد" },
    country: { en: "Iraq", ar: "العراق", iso: "IQ" },
    lat: 33.2625,
    lng: 44.2346,
    officialUrl: "https://iuaa.iq/",
    transportNote: {
      en: "Taxis and ride services serve the city; check current fares locally.",
      ar: "تتوفر سيارات أجرة وخدمات نقل إلى المدينة؛ تحقق من الأسعار محلياً.",
    },
    source: "Iraqi Civil Aviation Authority (iuaa.iq)",
    checked: "2026-10",
  },
  {
    iata: "EBL",
    icao: "ORER",
    name: { en: "Erbil International Airport", ar: "مطار أربيل الدولي" },
    city: { en: "Erbil", ar: "أربيل" },
    country: { en: "Iraq", ar: "العراق", iso: "IQ" },
    lat: 36.2381,
    lng: 43.9631,
    officialUrl: null,
    transportNote: {
      en: "Taxis serve the city centre; verify current practice on arrival.",
      ar: "تتوفر سيارات أجرة إلى وسط المدينة؛ تحقق من الوضع عند الوصول.",
    },
    source: "Public airport data (IATA/ICAO identifiers)",
    checked: "2026-10",
  },
  {
    iata: "ISU",
    icao: "ORSU",
    name: { en: "Sulaimani International Airport", ar: "مطار السليمانية الدولي" },
    city: { en: "Sulaymaniyah", ar: "السليمانية" },
    country: { en: "Iraq", ar: "العراق", iso: "IQ" },
    lat: 35.5567,
    lng: 45.3134,
    officialUrl: null,
    transportNote: null,
    source: "Public airport data (IATA/ICAO identifiers)",
    checked: "2026-10",
  },
  {
    iata: "NJF",
    icao: "ORNI",
    name: { en: "Najaf International Airport", ar: "مطار النجف الدولي" },
    city: { en: "Najaf", ar: "النجف" },
    country: { en: "Iraq", ar: "العراق", iso: "IQ" },
    lat: 31.9899,
    lng: 44.4044,
    officialUrl: null,
    transportNote: {
      en: "Serves Najaf and Karbala pilgrims; confirm flight availability with airlines.",
      ar: "يخدم زوّار النجف وكربلاء؛ تحقق من توفر الرحلات مع شركات الطيران.",
    },
    source: "Public airport data (IATA/ICAO identifiers)",
    checked: "2026-10",
  },
  {
    iata: "BSR",
    icao: "ORMM",
    name: { en: "Basra International Airport", ar: "مطار البصرة الدولي" },
    city: { en: "Basra", ar: "البصرة" },
    country: { en: "Iraq", ar: "العراق", iso: "IQ" },
    lat: 30.5491,
    lng: 47.6621,
    officialUrl: null,
    transportNote: null,
    source: "Public airport data (IATA/ICAO identifiers)",
    checked: "2026-10",
  },
  {
    iata: "KIA",
    icao: "ORKB",
    name: { en: "Karbala International Airport", ar: "مطار كربلاء الدولي" },
    city: { en: "Karbala", ar: "كربلاء" },
    country: { en: "Iraq", ar: "العراق", iso: "IQ" },
    lat: 32.6114,
    lng: 44.2453,
    officialUrl: null,
    transportNote: null,
    source: "Public airport data (IATA/ICAO identifiers)",
    checked: "2026-10",
  },
];

export function airportMapsUrl(a: Airport): string {
  return `https://www.google.com/maps?q=${a.lat},${a.lng}`;
}
