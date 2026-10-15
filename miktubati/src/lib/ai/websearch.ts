/* ATHAR Web Intelligence — provider-agnostic web search layer.
   Secrets stay server-side (env only). Every provider is optional; when none
   is configured the layer honestly reports `configured: false` and callers
   must say "web search is not enabled" instead of inventing results.

   Providers supported (swap via SEARCH_PROVIDER, default "tavily"):
     tavily  → https://api.tavily.com/search                       (TAVILY_API_KEY)
     brave   → https://api.search.brave.com/res/v1/web/search      (BRAVE_API_KEY)
     serper  → https://google.serper.dev/search                    (SERPER_API_KEY)

   Result shape is normalised; `url` is always a real link the provider
   returned — never synthesised. */

import { readDbEnv } from "@/lib/env";

export interface WebResult {
  title: string;
  url: string;
  snippet: string;
  publishedAt?: string | null;
  source: string;
}

export type SearchKind =
  | "cultural"
  | "historical"
  | "tourism"
  | "geographic"
  | "educational"
  | "news"
  | "weather"
  | "travel"
  | "general";

export interface SearchResponse {
  ok: boolean;
  results: WebResult[];
  provider: string;
  errorKey?: string;
}

export interface SearchStatus {
  configured: boolean;
  provider: string;
}

/* ── freshness / need-web classifier ───────────────────────────────────── */

const FRESH_AR =
  /(الآن|اليوم|غداً|غدا|هذا الأسبوع|هذا الشهر|الحالية|الحديثة|الأخيرة|حدث|أحداث|أخبار|طقس|الطقس|موسم|الموسم|افتتاح|افتُتح|جديد|الجديدة|202[5-9])/;
const FRESH_EN =
  /\b(now|today|tonight|tomorrow|this week|this weekend|this month|current|latest|recent|news|weather|forecast|season|opening|opened|new(ly)?|renovat\w+|restor\w+|202[5-9])\b/i;
const FORCE_AR = /(ابحث|بحث|الويب|المصدر|المصادر|رابط|روابط|تحقق|التحقق|أين يقع|كم|الأسعار|التذاكر|شروط الدخول|التأشيرة)/;
const FORCE_EN =
  /\b(search|look up|web|source|sources|link|links|verify|current price|ticket|visa|entry requirement|opening hours|hours today)\b/i;

/** True when the question needs live web information (not just internal KB). */
export function needsWeb(q: string): boolean {
  const s = (q || "").trim();
  if (!s) return false;
  if (FORCE_AR.test(s) || FORCE_EN.test(s)) return true;
  if (FRESH_AR.test(s) || FRESH_EN.test(s)) return true;
  return false;
}

/** Rough intent label used for logging and prompt shaping. */
export function classifyKind(q: string): SearchKind {
  const s = q.toLowerCase();
  if (/(weather|طقس|forecast)/.test(s)) return "weather";
  if (/(news|أخبار|حدث)/.test(s)) return "news";
  if (/(flight|hotel|restaurant|trip|travel|سفر|رحلة|فندق|مطعم|طيران)/.test(s)) return "travel";
  if (/(price|ticket|hours|open|أسعار|تذاكر|أوقات|مفتوح)/.test(s)) return "tourism";
  if (/(map|directions|distance|أين|موقع|خريطة|مسافة)/.test(s)) return "geographic";
  if (/(book|library|author|كتاب|مؤلف|مكتبة)/.test(s)) return "educational";
  if (/(history|historical|civilization|تاريخ|حضارة|أثري)/.test(s)) return "historical";
  if (/(culture|custom|tradition|ثقافة|عادة|تقاليد)/.test(s)) return "cultural";
  return "general";
}

/* ── provider implementations ──────────────────────────────────────────── */

function activeProvider(): { name: string; key: string } {
  const env = readDbEnv();
  if (env.searchProvider === "brave" && env.braveApiKey) return { name: "brave", key: env.braveApiKey };
  if (env.searchProvider === "serper" && env.serperApiKey) return { name: "serper", key: env.serperApiKey };
  if (env.tavilyApiKey) return { name: "tavily", key: env.tavilyApiKey };
  if (env.braveApiKey) return { name: "brave", key: env.braveApiKey };
  if (env.serperApiKey) return { name: "serper", key: env.serperApiKey };
  return { name: "", key: "" };
}

export function searchStatus(): SearchStatus {
  const p = activeProvider();
  return { configured: Boolean(p.key), provider: p.name };
}

const TIMEOUT_MS = 10_000;
const USER_AGENT = "ATHAR-AI/1.0 (+https://miktubati.local)";

async function searchTavily(key: string, q: string, max: number): Promise<WebResult[]> {
  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}`, "User-Agent": USER_AGENT },
    body: JSON.stringify({ query: q, max_results: max, include_answer: false }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`tavily_${res.status}`);
  const data = (await res.json()) as {
    results?: { title?: string; url?: string; content?: string; published_date?: string }[];
  };
  return (data.results ?? []).map((r) => ({
    title: r.title ?? "",
    url: r.url ?? "",
    snippet: (r.content ?? "").slice(0, 500),
    publishedAt: r.published_date ?? null,
    source: hostOf(r.url ?? ""),
  }));
}

async function searchBrave(key: string, q: string, max: number): Promise<WebResult[]> {
  const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(q)}&count=${max}`;
  const res = await fetch(url, {
    headers: { Accept: "application/json", "X-Subscription-Token": key, "User-Agent": USER_AGENT },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`brave_${res.status}`);
  const data = (await res.json()) as {
    web?: { results?: { title?: string; url?: string; description?: string; age?: string; page_age?: string }[] };
  };
  return (data.web?.results ?? []).map((r) => ({
    title: r.title ?? "",
    url: r.url ?? "",
    snippet: (r.description ?? "").slice(0, 500),
    publishedAt: r.page_age ?? r.age ?? null,
    source: hostOf(r.url ?? ""),
  }));
}

async function searchSerper(key: string, q: string, max: number): Promise<WebResult[]> {
  const res = await fetch("https://google.serper.dev/search", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-API-KEY": key, "User-Agent": USER_AGENT },
    body: JSON.stringify({ q, num: max }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`serper_${res.status}`);
  const data = (await res.json()) as {
    organic?: { title?: string; link?: string; snippet?: string; date?: string }[];
  };
  return (data.organic ?? []).map((r) => ({
    title: r.title ?? "",
    url: r.link ?? "",
    snippet: (r.snippet ?? "").slice(0, 500),
    publishedAt: r.date ?? null,
    source: hostOf(r.link ?? ""),
  }));
}

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

/* ── in-memory TTL cache (per server instance) ─────────────────────────── */

interface CacheEntry {
  expires: number;
  response: SearchResponse;
}
const cache = new Map<string, CacheEntry>();
const TTL_MS = 5 * 60 * 1000;
const MAX_CACHE = 200;

/** Perform a web search. Never throws — failures return ok:false. */
export async function webSearch(q: string, opts?: { max?: number }): Promise<SearchResponse> {
  const query = (q || "").trim().slice(0, 400);
  const max = Math.min(Math.max(opts?.max ?? 6, 1), 10);
  const p = activeProvider();
  if (!p.key || !query) {
    return { ok: false, results: [], provider: p.name, errorKey: "web_not_configured" };
  }

  const cacheKey = `${p.name}|${query}|${max}`;
  const hit = cache.get(cacheKey);
  if (hit && hit.expires > Date.now()) return hit.response;

  let results: WebResult[] = [];
  try {
    if (p.name === "brave") results = await searchBrave(p.key, query, max);
    else if (p.name === "serper") results = await searchSerper(p.key, query, max);
    else results = await searchTavily(p.key, query, max);
  } catch {
    const failure: SearchResponse = { ok: false, results: [], provider: p.name, errorKey: "web_search_failed" };
    cache.set(cacheKey, { expires: Date.now() + 60_000, response: failure });
    return failure;
  }

  // keep only http(s) links — never surface javascript:/data: etc.
  results = results.filter((r) => /^https?:\/\//i.test(r.url)).slice(0, max);
  const response: SearchResponse = { ok: true, results, provider: p.name };

  if (cache.size >= MAX_CACHE) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  cache.set(cacheKey, { expires: Date.now() + TTL_MS, response });
  return response;
}
