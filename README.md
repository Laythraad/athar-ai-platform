# ATHAR IRAQ

**أثَر العراق — Iraq's living heritage: sourced, mapped, planned.**
Culture & Tourism Hackathon – Iraq 2026 · website-only build · runs from a single folder with no server and no build step.

> 20 sourced Iraqi sites across 8 governorates, plus a 176-site world atlas behind one toggle. Every fact carries its source, the AI guide answers from retrieved knowledge chunks with citations, and the trip planner builds realistic day plans from real coordinates.

---

## What it is

A static single-page website (`site/`) that works by double-clicking `index.html` — no Node, no bundler, no server. The whole product is plain HTML, CSS and classic `<script>` files, so it also works from a USB stick or a judge's laptop with no network.

**Iraq first.** Home, Explore, the trip planner and the AI guide default to Iraq's governorates. The world atlas (176 sites, 133 countries) is one toggle away in Explore — never the default.

| Feature | What the judge sees |
| --- | --- |
| **Home** | Iraq-first hero (20 sites), stats (sites / governorates / languages / sourced places), featured Iraqi sites, browse-by-governorate grid, how-it-works. |
| **Explore** | 20 Iraqi sites by default; governorate / interest / category / country / region filters; full-text search; world atlas toggle. Every card shows its coordinate-precision label and source publisher. |
| **Place pages (ATHAR Card)** | Summary, "why it matters", key facts, era, suggested visit time, **governorate**, coordinate precision, source (title, publisher, URL, date checked), last-verified date, **Google Maps link**, **Add to Trip**, **Share**, **listen** (speech synthesis), related places with distances. Opening hours and entry fees are left blank (`—`) when not in sources — never guessed. |
| **Trip planner** | Pick a governorate, number of days and interests → rule-based, ordered day plans with haversine travel-time estimates, per-stop sources, Google Maps links, Add-to-Trip. Pace presets (relaxed / balanced / packed). Honest note: hours/fees not in sources. |
| **World map** | Real Natural Earth borders, Equal Earth projection, 176 markers colour-coded by precision. Zoom, pan, tap a marker to open the place. |
| **AI guide (RAG)** | Runtime knowledge chunks from Iraq sites; BM25-lite top-k retrieval; strict JSON `{answer, citations[{chunkId, source, url}], confidence}`. Three voices (MSA, Iraqi dialect, English) with identical facts. Offline / no-key fallback returns retrieved chunks labelled "no AI used". Photo attachment (vision) included. |
| **Heritage passport** | Explored places, progress ring, 8 badges, 5 quests — all computed locally in `localStorage`. Wording is always *explored*, never *physically visited*. |
| **18 interface languages** | English, Arabic, Kurdish (Sorani), French, Spanish, Turkish, Persian, German, Chinese, Japanese, Hindi, Indonesian, Russian, Portuguese, Italian, Korean, Urdu, Hungarian — all with full RTL where needed, all 293 UI strings translated. Plus a "translate to any language" tool powered by the free Google Translate endpoint. |
| **Trust & method** | Explains the three coordinate-precision levels, the source policy, and what is machine translated. Every source is listed with a link. |

## Run it

```bash
# just open the file
start site\index.html

# force a language (18 available)
start site\index.html?lang=ar
start site\index.html?lang=ku
start site\index.html?lang=zh

# or serve it if you prefer
python -m http.server 8080 -d site     # then http://localhost:8080
```

No `npm install`, no `flutter pub get`, no API key needed for browsing, the map, the planner, the passport or the translations. The atlas and the map work fully offline.

## AI guide setup (optional)

The AI guide is the only feature that needs a network and a key. It uses your own OpenAI key, stored **only** in the browser (`localStorage`) — never in the repo, never on a server.

1. Get a key at https://platform.openai.com/api-keys and make sure the account has credits.
2. Open the site → **Settings** → **AI guide** → paste the key → **Save key**.
3. Or pre-fill it for a demo machine by editing `site/config.local.js`:

```js
window.MORS_CONFIG = { openaiKey: "sk-..." };
```

`site/config.local.js` is listed in `.gitignore` — do not commit it.

**Honest states:** if the key is missing the guide says so; if the account has no credits the guide falls back to offline knowledge-chunk results labelled "no AI used" — it never pretends to answer.

## Project layout

```
site/
  index.html          # SPA shell: all views, no framework
  styles.css          # stone / sand / copper / teal palette, light/dark/auto themes, RTL via logical properties
  preview.png         # screenshot of the home page
  config.local.js     # (optional, gitignored) your OpenAI key
  js/
    store.js          # localStorage wrapper (lang, theme, visited, key, trip, events)
    i18n.js           # 18 languages, translation service, RTL handling
    map.js            # Equal Earth projection, real borders, zoom/pan
    ai.js             # RAG: knowledge chunks, BM25-lite, citations, confidence, offline fallback
    app.js            # routing, all view renderers, trip planner, passport logic
  data/
    world.js          # Natural Earth 110m borders, 176 countries, labels
    sites-*.js        # 176 place records (7 regional files), 20 in sites-iraq.js
    i18n*.js          # 293 UI strings × 18 languages (6 files)
```

## Data

- **20 Iraqi sites** across 8 governorates: Babylon, Ur, Hatra, Ashur, Samarra, Nineveh, Erbil Citadel, the Marshes, Ctesiphon, and more. Each with bilingual name / governorate / city / era / summary / significance / key facts, coordinate + precision label (`verified` / `site` / `city`), category, suggested visit minutes, tags, source (URL, publisher, title, date checked), `lastVerifiedAt`, and explicit `null` for opening hours / entry fees / accessibility notes when not in sources.
- **176 world sites**, 133 countries — available behind the Explore world-atlas toggle.
- **Coordinates** are real; precision is labelled honestly — `verified` = checked against the monument, `site` = on the property, `city` = the city is certain but the exact spot is approximate.
- **Sources** are UNESCO World Heritage Centre, Iraq's State Board of Antiquities and Heritage, official institutions, or Wikipedia — all listed on the Trust page with links.

## Design principles

1. **Honesty over hype.** Sources on every place page; coordinate precision is labelled; travel times are estimates, not live traffic; opening hours and fees are left blank when unknown; the AI says when it is unsure and when the atlas does not cover a topic; passport wording is *explored*, never *visited*.
2. **Iraq first.** The default experience is Iraqi sites and governorates. The world atlas is secondary, never the landing view.
3. **Offline-first.** The atlas, the map, the planner, the passport and the translations work with no network and no key — critical for a live demo on venue Wi-Fi.
4. **Your key, your device.** The OpenAI key lives in `localStorage` only; `config.local.js` is gitignored.
5. **No build step.** Plain HTML, CSS and classic scripts. Open the file, it works.

## Verification

- 20 Iraqi site records, unique IDs, all required fields present, all coordinates in range, all sources complete — audited with a schema checker (0 problems).
- 18 languages × 293 keys, parity verified across all dictionaries (0 gaps).
- `node --check` passes on every `.js` file.
- Headless Chrome: no console errors; all views (Home, Explore, Detail, Plan, Map, Passport, AI, Trust, Settings) render; `?lang=ar` produces `dir="rtl"` with correct Arabic strings (verified via DOM dump).
- Map verified with real borders, markers and country labels.
- Trip planner verified: governorate / days / pace / interests → ordered day plans with travel estimates and sources.
- AI RAG verified: retrieval returns Iraq-site chunks; offline fallback labelled "no AI used"; strict JSON citations and confidence parsed.

## Pitch & judge Q&A

See [`docs/PITCH.md`](docs/PITCH.md) for a 3-minute pitch script and 8 anticipated judge questions with answers.
