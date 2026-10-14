/* Generic Gemini text/JSON helper — server-side only.
   Used by the AI features that are NOT moderation (translation, auto-tags).
   Moderation keeps its own stricter caller in ../moderation/gemini.ts.

   Both helpers throw on any failure so callers can fall back gracefully
   (never block a publish or a page on a flaky AI call). */

import { readDbEnv } from "@/lib/env";

const ENDPOINT = (model: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

export interface GenOpts {
  system: string;
  user: string;
  maxTokens?: number;
  temperature?: number;
  /** Force a JSON response_mime and parse it. */
  json?: boolean;
  apiKey?: string;
  model?: string;
  fetchImpl?: typeof fetch;
}

function stripFences(raw: string): string {
  return String(raw || "")
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/, "")
    .replace(/\s*```$/, "");
}

async function call(opts: GenOpts): Promise<string> {
  const env = readDbEnv();
  const apiKey = opts.apiKey ?? env.geminiApiKey;
  const model = opts.model ?? (env.geminiModel || "gemini-flash-lite-latest");
  const fetchImpl = opts.fetchImpl ?? fetch;

  if (!apiKey) throw new Error("ai_not_configured");

  const body: Record<string, unknown> = {
    systemInstruction: { parts: [{ text: opts.system }] },
    contents: [{ role: "user", parts: [{ text: opts.user }] }],
    generationConfig: {
      temperature: opts.temperature ?? 0.3,
      maxOutputTokens: opts.maxTokens ?? 800,
      ...(opts.json ? { responseMimeType: "application/json" } : {}),
    },
  };

  let res: Response;
  try {
    res = await fetchImpl(`${ENDPOINT(model)}?key=${encodeURIComponent(apiKey)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error("ai_unavailable");
  }

  if (!res.ok) throw new Error("ai_unavailable");

  interface G {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  }
  let data: G;
  try {
    data = (await res.json()) as G;
  } catch {
    throw new Error("ai_bad_response");
  }

  const text =
    data?.candidates?.[0]?.content?.parts?.map((p) => p?.text ?? "").join("") ?? "";
  if (!text.trim()) throw new Error("ai_bad_response");
  return text;
}

/** Plain-text completion. */
export async function generateText(opts: GenOpts): Promise<string> {
  return (await call(opts)).trim();
}

/** JSON completion, loosely parsed (tolerates ``` fences / surrounding prose). */
export async function generateJson<T>(opts: GenOpts): Promise<T> {
  const raw = stripFences(await call({ ...opts, json: true }));
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  const slice = start !== -1 && end !== -1 ? raw.slice(start, end + 1) : raw;
  try {
    return JSON.parse(slice) as T;
  } catch {
    throw new Error("ai_bad_response");
  }
}
