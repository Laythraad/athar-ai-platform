# مكتبتي — MIKTUBATI

> **اقرأ. اكتب. اترك أثرك.** — Read. Write. Leave your trace.

A community library for Iraqi and Arab writing, built as the community layer of
[ATHAR IRAQ](../site/index.html). Readers browse and rate; writers publish;
every submission passes moderation before it can appear.

This is the Next.js module. The static ATHAR heritage atlas lives in `../site/`
and is a separate, self-contained demo.

---

## What this is

| | |
|---|---|
| Stack | Next.js 16.4 (App Router), TypeScript, Tailwind v4, Supabase |
| Languages | Arabic (primary, RTL) and English (LTR) — switchable in the header |
| Auth | Supabase — email+password and Google OAuth, email verification required |
| Roles | `member` → `moderator` → `admin` |
| Moderation | Deterministic rule layer → Gemini → human queue (fail-closed) |

**Community content is never presented as verified.** Every work is labelled
*Community content — not verified*, and community works are structurally kept
out of the ATHAR verified knowledge base.

---

## Honest status

This project was built **ready-to-connect**. There are no live Supabase
credentials in this environment, so the parts below are marked truthfully.

### Ran and passing locally

| Check | Command | Result |
|---|---|---|
| Unit tests | `npm test` | **80 passed / 80** (6 files) |
| Type check | `npx tsc --noEmit` | **clean** |
| Lint | `npm run lint` | **clean, 0 problems** |
| Production build | `npm run build` | **27 routes compiled** |
| Dev render (headless Chrome) | `/` `/library` `/guidelines` `/signin` `/publish` `/admin` | **all render, RTL correct** |
| Language switching | AR ⇄ EN via cookie | **shell + page bodies + `dir`/`lang` all switch** |

The unit tests cover the pure logic that has no database dependency:
moderation normalisation, the rule layer, the fail-closed pipeline, XSS
sanitisation, publish validation, weighted star-rating math, and rate limiting.

### NOT run — needs a live Supabase project

These are implemented and type-check, but **have not been executed against a
real database**. Do not assume they work until you run them:

- Every RLS policy (written in `supabase/migrations/0001_init.sql`)
- Sign-up, email verification, Google OAuth callback
- Onboarding (guidelines acceptance → pen name → bio)
- Publish → moderation → insert, and the status transitions
- Star-rating writes and the `recalc_author_rating` aggregate
- The admin moderation queue, user management (appoint/remove moderator,
  suspend/ban), report resolution, and audit log
- Private storage uploads and signed-URL downloads
- The `ADMIN_EMAIL` role grant (`grant_admin_if_configured`)

### NOT run — needs a Gemini key

The Gemini caller is implemented and its **failure paths are unit-tested with
mocks**. It has never been called against the live API. Without a key the
pipeline fails closed: content goes to `pending_review`, never to `published`.

---

## Run it

```bash
npm install
cp .env.example .env.local      # then fill in your Supabase keys
npm run dev                     # http://localhost:3000
```

Without keys the app still boots and renders honestly — every data-backed page
shows *"The database is not connected yet"* instead of fake content. There is no
mock data anywhere in this project.

### Connect a real database

1. Create a Supabase project.
2. Apply `supabase/migrations/0001_init.sql` (SQL editor, or `supabase db push`).
3. In Supabase → Authentication → Providers, enable **Email** and **Google**.
   For Google, set the callback to `<site>/auth/callback`.
4. Fill `.env.local` from `.env.example`.
5. Sign up with the address in `ADMIN_EMAIL`, verify the email, complete
   onboarding. The server grants `admin` only to that address, and only once
   the email is verified — enforced in Postgres, not in client state.

---

## How moderation works

Every submission — work, pen name, bio — goes through the same pipeline:

```
validate (zod)  →  sanitize (XSS)  →  rules  →  Gemini  →  status
                                          ↓            ↓
                                    hard term    AI unavailable
                                        ↓            ↓
                                    rejected    pending_review
```

**Fail-closed by design.** If Gemini is missing, errors, or returns nonsense,
the content is routed to a human moderator. It is never auto-published on error.

**Literature is not censored.** Explicit slurs, sexual terms and sectarian hate
are auto-rejected. Violence and mature *sexual-adjacent* words — which appear
legitimately in war memoirs, tragedy and classical poetry — go to a human
reviewer, not to the shredder. The rule layer is a hard floor, not a
comprehensive filter; the AI layer is the broad catch.

**Clients cannot publish themselves.** A Postgres trigger forces
`pending_review` on insert and blocks clients from changing `status`. Only the
service-role key — reachable solely from server routes — can approve.

**Every privileged action is audited.** Approvals, rejections, role changes and
guideline publications all write to `audit_log` and `moderation_events` with the
acting user's id.

---

## Security model

- **RLS is the wall.** Client reads go through the anon key; Postgres policies
  decide visibility. Anonymous callers see only `published` works.
- **`user_roles` has no client write policies.** Only the service role grants
  roles.
- **`ADMIN_EMAIL` is a second, independent gate.** Even with a role row, the
  email must match `ADMIN_EMAIL` *and* be verified. Checked on the server and
  re-checked inside the `grant_admin_if_configured` Postgres function.
- **Storage buckets are private.** Files are served only via short-lived signed
  URLs, and the object path comes from the database — never from the query
  string.
- **Acceptance records are immutable.** `guideline_acceptances` rows are never
  rewritten. Publishing a new guideline version routes everyone back through
  onboarding; the old acceptance stays on the record.
- **Admin panel follows least privilege.** Moderators can approve/reject works,
  suspend accounts, and resolve reports. Only the admin can appoint/remove
  moderators or ban. Nobody — including the admin — can act on their own
  account, and the `ADMIN_EMAIL` account is untouchable at any level.
- **Rate limiting** on publishing, ratings, reports and moderation actions.

---

## Layout

```
src/
  app/                  pages + API routes
    api/                publish, ratings, reports, onboarding,
                        work-file, admin/{works,users,reports,guidelines}
    admin/              moderation queue, reports, audit log
    library/            community feed (search, category, sort)
    my/  my-works/      reading list + the author's own works
    onboarding/         guidelines → pen name → bio
    publish/            submission form
    author/[id]/        profile + star ratings
    work/[id]/          work detail + report
  components/           Header, Footer, WorkCard, Stars, AdminActions, …
  lib/
    moderation/         normalize, profanity lists, rules, gemini, pipeline
    validation/         zod schema + XSS sanitisation
    supabase/           browser / server / service-role clients
    server/             shared API auth + audit helpers
    session.ts          the anonymous→verify→onboarding→member state machine
    roles.ts            server-side role resolution
    ratings.ts          Bayesian-damped average + rate limiter
    i18n.ts             ar/en dictionaries (186 keys each)
    guidelines-text.ts  the real guidelines, source of truth
supabase/
  migrations/0001_init.sql   15 tables, enums, RLS, triggers, buckets, seed
```

---

## Design

Reuses the ATHAR identity so the two read as one product: dark stone primary,
sand backgrounds, muted copper accents, Georgia display type. Arabic is the
primary language and the layout is RTL throughout via CSS logical properties.

---

## Star ratings

One rating per (author, rater), editable, no self-rating. The displayed average
is **Bayesian-damped** — a single 5★ cannot rocket an author to the top of the
library. With few votes the average is pulled toward the prior; as votes
accumulate it converges on the true mean. The aggregate is recomputed in
Postgres from the source rows, so a crafted client payload cannot inflate it.
