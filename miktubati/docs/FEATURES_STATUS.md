# ATHAR AI — Feature Status

_Last verified: 2026-10-15 (gates: tsc, eslint, vitest 134/134, next build)_

## Implemented and working

| Feature | Status | Notes |
| --- | --- | --- |
| Heritage atlas (20 sourced Iraqi sites) | ✅ | maps links, related sites, precision labels |
| Community library (publish / read / rate / report) | ✅ | moderated publish flow, PDF upload w/ text extraction |
| **My Library** (private PDF/text/image upload) | ✅ | 25 MB cap, MIME + magic-byte checks, private `library-files` bucket, owner-only RLS |
| **PDF reader** (pdf.js canvas) | ✅ | page nav, zoom, last-page persistence, private notes |
| **My Library AI** | ✅ | summarize / ideas / quiz / terms / ask — uses the owner's file text only, cites pages when derivable |
| **ATHAR AI unified chat** | ✅ | grounded on heritage dataset; Gemini when configured; honest retrieval fallback |
| **ATHAR Web Intelligence** | ✅ (needs key) | tavily / brave / serper; freshness classifier; citation validation; TTL cache; honest failure mode |
| **Safety layer** | ✅ | danger detection w/ discussion-context exclusion; per-country sourced emergency numbers; never claims dispatch |
| **Nearby places** | ✅ | explicit-permission geolocation, manual city fallback, client-side distance, Maps links |
| **Travel hub + Airports** | ✅ | 6 Iraqi airports (IATA/ICAO/coords/maps/official links); **no invented flight data** |
| **My Trip** | ✅ | device-local stops, Maps links, AI day-plan via /api/athar-ai |
| **Cultural guide ("know before you go")** | ✅ | per-governorate dress/photo/greetings/markets notes on heritage pages |
| **Creative Studio** | ✅ | private drafts (poem/story/note), AI ideas/edit tips |
| **ATHAR Kids** | ✅ | curated bilingual stories + quizzes; strict kids-ai endpoint (refuses PII/off-topic) |
| **Cultural Passport** | ✅ | visited-site log (server-backed when signed in, localStorage otherwise), badges |
| 18 UI languages | ✅ | ar/en hand-written; 16 generated via Gemini |
| Community rules page | ✅ | /guidelines, versioned, acceptance-gated |

## Honest limitations (not bugs)

- **Web search requires a provider key** (`TAVILY_API_KEY` / `BRAVE_API_KEY` / `SERPER_API_KEY`). Without one, ATHAR AI states that web search is not enabled and answers from the internal dataset only.
- **No live flight/hotel data.** Airports page links to official sources instead of fabricating schedules.
- **No Google Places integration.** Ratings/reviews/hours for arbitrary businesses are not shown (would require Places API + ToS compliance).
- **Emergency numbers carry a verification date.** Users are told to confirm locally; 911 is shown for Iraq per government rollout announcements (checked 2026-10).
- **Scanned PDFs** yield no extractable text → My Library AI actions are disabled with an honest message (OCR is phase 3).
- **Kids platform** has no public publishing or messaging by design.
- **Nearby places** currently ranks the 20-site heritage dataset by distance; businesses (hotels/restaurants/clinics) require a places provider.

## External services & costs

| Service | Needed for | Cost model |
| --- | --- | --- |
| Supabase | DB, auth, storage | free tier OK to start |
| Google Gemini | moderation, AI answers, i18n generation | pay-per-token; flash-lite is cheapest |
| Tavily / Brave / Serper | live web search | free tiers exist; pay per query after |

## Database

Migrations `0001`–`0004` (`supabase/migrations/`). `0004` adds owner-only `library_items`, `library_notes`, `library_bookmarks`, `creative_works`, `user_passport` + private `library-files` bucket. Applied to the live project.

## Tests

134 vitest tests pass, covering: ratings math, moderation pipeline, PDF Arabic reading-order repair, heritage retrieval, library file validation, web-search classifier, safety detector + emergency data, culture/airports/trip helpers.
