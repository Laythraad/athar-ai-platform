# ATHAR IRAQ — Pitch & Judge Q&A

Culture & Tourism Hackathon — Iraq 2026 · Mors Team

---

## 3-minute pitch

### 0:00 — Hook (Iraq first)

"أثَر العراق — ATHAR IRAQ. Most heritage apps treat Iraq as one pin on a world map. We treat Iraq as the product. Twenty sourced sites across eight governorates, a trip planner that builds real day plans, and an AI guide that cites every fact — all offline from a single folder."

### 0:30 — The problem

"Tourists, students and locals want to explore Iraq's heritage, but information is scattered: UNESCO pages in English, Wikipedia in fragments, no map that works on a phone with no signal, no planner that respects real travel times. And AI chatbots invent facts about places that already face enough misinformation."

### 1:00 — What we built

"ATHAR IRAQ is a static website — no server, no build step — that runs from a double-click.

**Iraq first.** The home page opens on Iraqi sites and governorates. The world atlas is one toggle away, never the default.

**Every place is sourced.** Each of the 20 Iraqi sites carries a real source — UNESCO, Iraq's State Board of Antiquities, or Wikipedia — with publisher, title, and date checked. Opening hours and entry fees we don't have are left blank, never guessed.

**A trip planner, not a checklist.** Pick a governorate, days, and interests. The planner orders stops by haversine distance, estimates travel at 50 km/h road factor, and packs each day to a pace you choose. Every stop links to Google Maps and its source.

**An AI guide that cites.** We retrieve knowledge chunks from the Iraq atlas with BM25-lite, send the top matches to the model, and require a strict JSON answer with citations and a confidence level. If the atlas doesn't cover a question, the guide says so. No key? No network? It falls back to the retrieved chunks, labelled 'no AI used' — it never pretends to answer."

### 2:00 — Trust & honesty

"Three things we refuse to fake:

1. **Coordinate precision** — every site is labelled verified, on-site, or city-centre. The map colours match.
2. **Hours and fees** — null in the data means null in the UI. We show a dash and say 'not available in our sources.'
3. **Passport wording** — 'explored,' never 'visited.' You don't claim to have walked Babylon because you tapped a card."

### 2:30 — Offline & languages

"The whole thing runs from a folder. Atlas, map, planner, passport, translations — all offline. Critical for venue Wi-Fi.

Eighteen interface languages, full RTL for Arabic, Kurdish, Persian, Urdu. Plus a translate-to-any-language tool for phrases you need on the ground."

### 2:50 — Close

"ATHAR IRAQ: Iraq's heritage, sourced, mapped, planned — and honest about what we don't know. We'd love your questions."

---

## 8 Judge Q&A

### Q1: "How do you know the data is real? Can you prove it?"

Every site in `sites-iraq.js` carries a `source` object with `title`, `publisher`, `url`, and `checked` date. The Trust page lists all sources with links. The schema checker audits every record for required fields, coordinate ranges, and source completeness — 0 problems. If a field is unknown (hours, fees, accessibility), it is stored as `null` and displayed as `—` with an honest label.

### Q2: "What happens when the AI is wrong or invents a fact?"

Three layers of protection:

1. **Retrieval grounding.** The model only sees the top-8 knowledge chunks retrieved from the Iraq atlas. It cannot access the open web.
2. **Strict JSON.** The system prompt requires `{answer, citations[{chunkId, source, url}], confidence}`. Citations are parsed and shown to the user.
3. **Refusal.** If chunks don't cover the question, the model must set `confidence: "none"` and say so. Offline fallback (no key / no credits) never uses the model — it returns raw chunks labelled "no AI used."

We also display a disclaimer: "AI answers can be wrong. Check the source link before relying on a fact."

### Q3: "Why static HTML? Why not React/Next/Vue?"

The hackathon judges will open this on a laptop that may have no network. A static folder works from `file://`, a USB stick, or any static host — no npm install, no bundler, no server. The trade-off is no server-side AI proxy, so the OpenAI key lives in the browser's localStorage (gitignored, user-provided). For a production deployment, we'd move the key server-side; for a hackathon demo, client-side is the honest choice.

### Q4: "How does the trip planner estimate travel times?"

Haversine distance between site coordinates, multiplied by a 1.3 road factor, divided by an assumed 50 km/h average speed, plus a 15-minute transfer buffer. Every estimate is labelled as an estimate — we never claim live traffic. The planner packs each day to a pace budget (relaxed 180 min, balanced 300 min, packed 420 min) and stops when the day is full, starting a new day.

### Q5: "What about sites we don't have hours or fees for?"

We leave them blank. The data schema has `openingHours: null` and `visitCost: null` for all 20 Iraqi sites — because we could not find reliable, current sources for every site. The UI shows `—` and the label "not available in our sources." We would rather say "we don't know" than invent a number.

### Q6: "Is the map real? Are the borders real?"

Yes. The map uses Natural Earth 110m country boundaries, projected with an Equal Earth projection (equal-area, so Africa isn't shrunk). Markers are placed at real WGS84 coordinates. Zoom and pan work. The map renders offline from the bundled border data.

### Q7: "How do you handle 18 languages without a build step?"

Each language is a JSON-like dictionary loaded via classic `<script>` tags. The core 18 languages have 293 keys each, verified for parity (0 gaps). RTL languages (Arabic, Kurdish, Persian, Urdu) flip the layout via CSS logical properties. For any other language, a "translate to any language" tool uses the free Google Translate endpoint — machine-translated results are labelled as such.

### Q8: "What's the business model / sustainability story?"

For the hackathon: open-source, static, free to host anywhere. The AI guide uses the user's own OpenAI key (optional — the atlas works without it). For a production version: partner with Iraq's State Board of Antiquities and heritage NGOs to expand the site list; add verified hours/fees from official sources; offer a premium tier for offline audio guides and AR overlays (roadmap P2). The core product stays free and offline — that's non-negotiable for heritage access.

---

## Backup: feature inventory for demos

| View | URL hash | What to show |
| --- | --- | --- |
| Home | `#/home` | Iraq-first hero, 20 sites, 8 governorates, featured cards |
| Explore | `#/explore` | Governorate / interest filters, search, world atlas toggle |
| Detail | `#/detail/iq-babylon` | ATHAR Card: source, maps link, add-to-trip, related, null hours |
| Plan | `#/plan` | Governorate + days + pace + interests → ordered day plan |
| Map | `#/map` | Real borders, precision-coded markers, tap to open |
| Passport | `#/passport` | Explored count, badges, quests, by-continent / by-category bars |
| AI guide | `#/ai` | Ask about Babylon; show citations + confidence; try offline fallback |
| Trust | `#/trust` | Source list, precision explanations, method |
| Settings | `#/settings` | Language picker (18), OpenAI key, theme, translate tool |

## Backup: honest limitations to state if asked

- Opening hours and entry fees are null for all 20 sites — we have not found reliable sources yet.
- Travel times are geometric estimates, not live traffic.
- The AI guide needs an OpenAI key with credits; without it, the offline fallback is used.
- The world atlas toggle includes 176 sites but the trip planner currently focuses on Iraqi sites (P1: extend to world).
- No AR (P2 roadmap only) — we prioritised offline reliability over a flashy demo that needs a camera and network.
