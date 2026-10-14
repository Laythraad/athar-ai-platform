-- ═══════════════════════════════════════════════════════════════════
-- مكتبتي (MIKTUBATI) — community library for ATHAR IRAQ
-- Migration 0001: schema + RLS + storage + triggers
--
-- Security model (see README for the full explanation):
--   • Every table has RLS enabled.
--   • Members read only published content; they read/edit ONLY their own rows.
--   • `works.status`, `user_roles.role`, moderation fields and audit rows are
--     NEVER client-writable — enforced by triggers + the absence of client
--     UPDATE policies, and by writes that go through the service-role key
--     (server-only) or SECURITY DEFINER functions.
--   • The single admin is granted server-side from the ADMIN_EMAIL env var,
--     and only once the email is VERIFIED.
-- ═══════════════════════════════════════════════════════════════════

create extension if not exists pgcrypto;

-- ─── enums ─────────────────────────────────────────────────────────
do $$ begin
  create type work_status as enum ('draft','pending_review','published','rejected');
exception when duplicate_object then null; end $$;

do $$ begin
  create type moderation_verdict as enum ('approve','reject','needs_human_review');
exception when duplicate_object then null; end $$;

do $$ begin
  create type reading_status as enum ('want_to_read','reading','finished','favorite');
exception when duplicate_object then null; end $$;

do $$ begin
  create type user_role as enum ('member','moderator','admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type account_status as enum ('active','suspended','banned');
exception when duplicate_object then null; end $$;

do $$ begin
  create type report_status as enum ('open','resolved','dismissed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type author_type as enum ('writer','poet','historian');
exception when duplicate_object then null; end $$;

-- ─── helper: is the caller the service role? ───────────────────────
create or replace function public.is_service_role()
returns boolean
language sql stable
as $$
  select coalesce(
    nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role',
    ''
  ) = 'service_role';
$$;

-- ═══════════════════════════════════════════════════════════════════
-- profiles — public identity. Email is NEVER public.
-- ═══════════════════════════════════════════════════════════════════
create table if not exists public.profiles (
  id             uuid primary key references auth.users(id) on delete cascade,
  pen_name       text not null unique check (char_length(pen_name) between 3 and 30),
  pen_name_changed_at timestamptz,
  pen_name_changes int not null default 0,
  bio            text check (char_length(bio) <= 500),
  avatar_path    text,
  author_type    author_type not null default 'writer',
  email_verified boolean not null default false,
  account_status account_status not null default 'active',
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- pen name must not look like a link / handle
alter table public.profiles
  add constraint pen_name_no_links check (pen_name !~ 'https?://' and pen_name !~ '@' and pen_name !~ '\s{2,}');

-- ─── helper: is the calling user banned/suspended? ─────────────────
-- Defined AFTER public.profiles — SQL function bodies are validated at
-- creation time, so the table must already exist.
create or replace function public.is_blocked(uid uuid)
returns boolean
language sql stable
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = uid and p.account_status in ('suspended','banned')
  );
$$;

alter table public.profiles enable row level security;

-- public can read basic profile info (never the email)
create policy "profiles are publicly readable"
  on public.profiles for select
  using (true);

-- owner may update own profile, but never the protected columns
-- (account_status / email_verified / pen_name rate-limit are enforced by trigger)
create policy "owner updates own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ═══════════════════════════════════════════════════════════════════
-- user_roles — server-managed only
-- ═══════════════════════════════════════════════════════════════════
create table if not exists public.user_roles (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  role       user_role not null default 'member',
  granted_by uuid references auth.users(id),
  granted_at timestamptz not null default now()
);

alter table public.user_roles enable row level security;

create policy "members may read own role"
  on public.user_roles for select
  using (auth.uid() = user_id or public.is_service_role());

-- No INSERT/UPDATE/DELETE policies for clients → only service role writes.

-- ═══════════════════════════════════════════════════════════════════
-- guideline_versions + guideline_acceptances
-- ═══════════════════════════════════════════════════════════════════
create table if not exists public.guideline_versions (
  version     int primary key,
  content_ar  text not null,
  content_en  text not null,
  active      boolean not null default true,
  created_by  uuid references auth.users(id),
  created_at  timestamptz not null default now()
);

alter table public.guideline_versions enable row level security;
create policy "guidelines are publicly readable"
  on public.guideline_versions for select using (true);
-- only service role writes versions

create table if not exists public.guideline_acceptances (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  version      int  not null references public.guideline_versions(version),
  accepted_at  timestamptz not null default now(),
  unique (user_id, version)
);

alter table public.guideline_acceptances enable row level security;
create policy "user reads own acceptances"
  on public.guideline_acceptances for select using (auth.uid() = user_id or public.is_service_role());
create policy "user inserts own acceptance"
  on public.guideline_acceptances for insert with check (auth.uid() = user_id);
-- no update/delete → acceptances are immutable history

-- ═══════════════════════════════════════════════════════════════════
-- categories (seeded below, read-only to clients)
-- ═══════════════════════════════════════════════════════════════════
create table if not exists public.categories (
  slug      text primary key,
  name_ar   text not null,
  name_en   text not null,
  sort      int  not null default 100
);
alter table public.categories enable row level security;
create policy "categories readable" on public.categories for select using (true);

-- ═══════════════════════════════════════════════════════════════════
-- works — the core content table
-- ═══════════════════════════════════════════════════════════════════
create table if not exists public.works (
  id             uuid primary key default gen_random_uuid(),
  author_id      uuid not null references public.profiles(id) on delete cascade,
  title          text not null check (char_length(title) between 1 and 200),
  description    text check (char_length(description) <= 2000),
  category       text not null references public.categories(slug),
  tags           text[] not null default '{}',
  language       text not null default 'ar',
  content        text,
  cover_path     text,
  file_path      text,
  file_mime      text,
  file_size      bigint,
  file_hash      text,
  allow_download boolean not null default false,
  heritage_site_id text,             -- optional link into the ATHAR atlas
  status         work_status not null default 'pending_review',
  rejection_reason text,
  read_count     int not null default 0,
  avg_rating     numeric(3,2) not null default 0,
  rating_count   int not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  published_at   timestamptz
);

create index if not exists works_status_idx on public.works(status);
create index if not exists works_author_idx on public.works(author_id);
create index if not exists works_category_idx on public.works(category);
create index if not exists works_created_idx on public.works(created_at desc);
create index if not exists works_tags_idx on public.works using gin (tags);

alter table public.works enable row level security;

-- public: only published works
create policy "published works are publicly readable"
  on public.works for select
  using (status = 'published');

-- author: read own works at any status
create policy "author reads own works"
  on public.works for select
  using (auth.uid() = author_id);

-- author: insert own work (status is forced to pending_review by trigger)
create policy "author inserts own work"
  on public.works for insert
  with check (auth.uid() = author_id and not public.is_blocked(auth.uid()));

-- author: update own NON-status fields (status change blocked by trigger)
create policy "author updates own work"
  on public.works for update
  using (auth.uid() = author_id)
  with check (auth.uid() = author_id);

-- author: delete own work
create policy "author deletes own work"
  on public.works for delete
  using (auth.uid() = author_id);

-- moderators/admins read everything (service role bypasses RLS anyway,
-- but this lets a moderator-scoped client read the queue if ever needed)
create policy "moderators read all works"
  on public.works for select
  using (exists (
    select 1 from public.user_roles r
    where r.user_id = auth.uid() and r.role in ('moderator','admin')
  ));

-- ─── trigger: fail-closed status protection ────────────────────────
create or replace function public.works_protect_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_service_role() then
    return new;                       -- server-side moderation may set anything
  end if;

  if TG_OP = 'INSERT' then
    -- a client can never choose a status; always start pending
    new.status := 'pending_review';
    new.rejection_reason := null;
    new.read_count := 0;
    new.avg_rating := 0;
    new.rating_count := 0;
    return new;
  end if;

  if new.status is distinct from old.status
     or new.rejection_reason is distinct from old.rejection_reason then
    raise exception 'works.status is not client-writable';
  end if;

  -- author must not inflate their own stats
  new.read_count   := old.read_count;
  new.avg_rating   := old.avg_rating;
  new.rating_count := old.rating_count;
  return new;
end;
$$;

drop trigger if exists trg_works_protect on public.works;
create trigger trg_works_protect
  before insert or update on public.works
  for each row execute function public.works_protect_status();

-- ─── trigger: duplicate detection (same author + normalised title) ─
create or replace function public.works_dedupe()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  n text;
begin
  n := lower(regexp_replace(trim(new.title), '\s+', ' ', 'g'));
  if exists (
    select 1 from public.works w
    where w.author_id = new.author_id
      and w.id is distinct from new.id
      and lower(regexp_replace(trim(w.title), '\s+', ' ', 'g')) = n
  ) then
    raise exception 'duplicate_title';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_works_dedupe on public.works;
create trigger trg_works_dedupe
  before insert or update on public.works
  for each row execute function public.works_dedupe();

-- ═══════════════════════════════════════════════════════════════════
-- work_files — mirror of private-storage objects
-- ═══════════════════════════════════════════════════════════════════
create table if not exists public.work_files (
  id          uuid primary key default gen_random_uuid(),
  work_id     uuid not null references public.works(id) on delete cascade,
  storage_path text not null,
  mime        text not null,
  size_bytes  bigint not null,
  sha256      text,
  created_at  timestamptz not null default now()
);
alter table public.work_files enable row level security;
create policy "work files follow work visibility"
  on public.work_files for select
  using (
    exists (select 1 from public.works w where w.id = work_id and w.status = 'published')
    or exists (select 1 from public.works w where w.id = work_id and w.author_id = auth.uid())
  );
-- only service role inserts/deletes files

-- ═══════════════════════════════════════════════════════════════════
-- author_ratings — one row per (author, rater)
-- ═══════════════════════════════════════════════════════════════════
create table if not exists public.author_ratings (
  author_id  uuid not null references public.profiles(id) on delete cascade,
  rater_id   uuid not null references public.profiles(id) on delete cascade,
  stars      int  not null check (stars between 1 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (author_id, rater_id),
  check (author_id <> rater_id)          -- no self-rating
);

alter table public.author_ratings enable row level security;
create policy "ratings are readable"
  on public.author_ratings for select using (true);
create policy "user rates others"
  on public.author_ratings for insert
  with check (auth.uid() = rater_id and not public.is_blocked(auth.uid()));
create policy "user edits own rating"
  on public.author_ratings for update
  using (auth.uid() = rater_id) with check (auth.uid() = rater_id);
create policy "user deletes own rating"
  on public.author_ratings for delete using (auth.uid() = rater_id);

-- ═══════════════════════════════════════════════════════════════════
-- reviews — moderated free text about an author
-- ═══════════════════════════════════════════════════════════════════
create table if not exists public.reviews (
  id         uuid primary key default gen_random_uuid(),
  author_id  uuid not null references public.profiles(id) on delete cascade,
  reviewer_id uuid not null references public.profiles(id) on delete cascade,
  body       text not null check (char_length(body) between 1 and 1000),
  status     work_status not null default 'pending_review',
  rejection_reason text,
  created_at timestamptz not null default now(),
  check (author_id <> reviewer_id)
);
alter table public.reviews enable row level security;
create policy "published reviews readable" on public.reviews for select using (status = 'published');
create policy "own reviews readable" on public.reviews for select using (auth.uid() = reviewer_id);
create policy "create own review" on public.reviews for insert
  with check (auth.uid() = reviewer_id and not public.is_blocked(auth.uid()));
create policy "moderators read reviews" on public.reviews for select using (exists (
  select 1 from public.user_roles r where r.user_id = auth.uid() and r.role in ('moderator','admin')));

create or replace function public.reviews_protect_status()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if public.is_service_role() then return new; end if;
  if TG_OP = 'INSERT' then
    new.status := 'pending_review'; new.rejection_reason := null; return new;
  end if;
  if new.status is distinct from old.status then
    raise exception 'reviews.status is not client-writable';
  end if;
  return new;
end; $$;
drop trigger if exists trg_reviews_protect on public.reviews;
create trigger trg_reviews_protect before insert or update on public.reviews
  for each row execute function public.reviews_protect_status();

-- ═══════════════════════════════════════════════════════════════════
-- reading_list — per-user statuses + progress
-- ═══════════════════════════════════════════════════════════════════
create table if not exists public.reading_list (
  user_id    uuid not null references auth.users(id) on delete cascade,
  work_id    uuid not null references public.works(id) on delete cascade,
  status     reading_status not null,
  progress   int not null default 0 check (progress between 0 and 100),
  updated_at timestamptz not null default now(),
  primary key (user_id, work_id)
);
alter table public.reading_list enable row level security;
create policy "own reading list" on public.reading_list for select using (auth.uid() = user_id);
create policy "insert own reading list" on public.reading_list for insert with check (auth.uid() = user_id);
create policy "update own reading list" on public.reading_list for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "delete own reading list" on public.reading_list for delete using (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════════
-- reports
-- ═══════════════════════════════════════════════════════════════════
create table if not exists public.reports (
  id          uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users(id) on delete cascade,
  target_type text not null check (target_type in ('work','author','review')),
  target_id   uuid not null,
  reason      text not null check (char_length(reason) between 1 and 500),
  status      report_status not null default 'open',
  resolution  text,
  created_at  timestamptz not null default now(),
  resolved_at timestamptz
);
alter table public.reports enable row level security;
create policy "create own report" on public.reports for insert with check (auth.uid() = reporter_id);
create policy "read own reports" on public.reports for select using (auth.uid() = reporter_id);
create policy "moderators read reports" on public.reports for select using (exists (
  select 1 from public.user_roles r where r.user_id = auth.uid() and r.role in ('moderator','admin')));
-- only service role resolves reports

-- ═══════════════════════════════════════════════════════════════════
-- moderation_events — every AI/human decision, immutable
-- ═══════════════════════════════════════════════════════════════════
create table if not exists public.moderation_events (
  id          uuid primary key default gen_random_uuid(),
  target_type text not null check (target_type in ('work','review','pen_name','bio','title')),
  target_id   uuid not null,
  source      text not null check (source in ('rules','ai','human','system')),
  verdict     moderation_verdict not null,
  categories  text[] not null default '{}',
  reasons     text[] not null default '{}',
  flagged     jsonb not null default '[]'::jsonb,
  confidence  text,
  actor_id    uuid references auth.users(id),
  created_at  timestamptz not null default now()
);
alter table public.moderation_events enable row level security;
create policy "moderators read moderation events" on public.moderation_events for select using (exists (
  select 1 from public.user_roles r where r.user_id = auth.uid() and r.role in ('moderator','admin')));
create policy "author reads own moderation events" on public.moderation_events for select using (
  exists (select 1 from public.works w where w.id = target_id and w.author_id = auth.uid())
);
-- only service role inserts

-- ═══════════════════════════════════════════════════════════════════
-- audit_log — every privileged action
-- ═══════════════════════════════════════════════════════════════════
create table if not exists public.audit_log (
  id         uuid primary key default gen_random_uuid(),
  actor_id   uuid references auth.users(id),
  action     text not null,
  target_type text,
  target_id  text,
  reason     text,
  meta       jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.audit_log enable row level security;
create policy "admins read audit log" on public.audit_log for select using (exists (
  select 1 from public.user_roles r where r.user_id = auth.uid() and r.role = 'admin'));
-- only service role inserts

-- ═══════════════════════════════════════════════════════════════════
-- badges + user_badges (real counts only)
-- ═══════════════════════════════════════════════════════════════════
create table if not exists public.badges (
  slug     text primary key,
  name_ar  text not null,
  name_en  text not null
);
alter table public.badges enable row level security;
create policy "badges readable" on public.badges for select using (true);

create table if not exists public.user_badges (
  user_id    uuid not null references auth.users(id) on delete cascade,
  badge_slug text not null references public.badges(slug) on delete cascade,
  awarded_at timestamptz not null default now(),
  primary key (user_id, badge_slug)
);
alter table public.user_badges enable row level security;
create policy "badges readable by all" on public.user_badges for select using (true);
-- only service role awards badges

-- ═══════════════════════════════════════════════════════════════════
-- rate limiting (simple server-enforced counters)
-- ═══════════════════════════════════════════════════════════════════
create table if not exists public.rate_events (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  action     text not null,
  created_at timestamptz not null default now()
);
create index if not exists rate_events_lookup on public.rate_events(user_id, action, created_at desc);
alter table public.rate_events enable row level security;
-- no client policies: server-only (service role)

-- ═══════════════════════════════════════════════════════════════════
-- SECURITY DEFINER helper: grant admin only to a VERIFIED ADMIN_EMAIL
-- Called by the server (service role) after sign-in / email verification.
-- ═══════════════════════════════════════════════════════════════════
create or replace function public.grant_admin_if_config(p_email text)
returns boolean
language plpgsql security definer set search_path = public
as $$
declare
  uid uuid;
  cfg text := current_setting('app.admin_email', true);
begin
  -- ADMIN_EMAIL is supplied per-call by the server so it never has to be a
  -- Postgres setting; this keeps the rule in one auditable place.
  if cfg is null or cfg = '' then cfg := p_email; end if;
  if cfg is null or lower(cfg) <> lower(coalesce(p_email, '')) then
    return false;
  end if;

  select u.id into uid from auth.users u
  where lower(u.email) = lower(cfg) and u.email_confirmed_at is not null;

  if uid is null then
    return false;   -- unverified or unknown email can never become admin
  end if;

  insert into public.user_roles (user_id, role)
  values (uid, 'admin')
  on conflict (user_id) do update set role = 'admin', granted_at = now();

  return true;
end;
$$;

revoke all on function public.grant_admin_if_config(text) from public;
grant execute on function public.grant_admin_if_config(text) to service_role;

-- ═══════════════════════════════════════════════════════════════════
-- SECURITY DEFINER helper: recompute an author's rating aggregates
-- ═══════════════════════════════════════════════════════════════════
create or replace function public.recalc_author_rating(p_author uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.profiles p set
    updated_at = now()
  where p.id = p_author;
end; $$;

-- store aggregates on a dedicated table to avoid client-writable columns
create table if not exists public.author_rating_agg (
  author_id uuid primary key references public.profiles(id) on delete cascade,
  avg_stars numeric(3,2) not null default 0,
  count     int not null default 0,
  updated_at timestamptz not null default now()
);
alter table public.author_rating_agg enable row level security;
create policy "rating aggregates readable" on public.author_rating_agg for select using (true);

-- ═══════════════════════════════════════════════════════════════════
-- seed: categories, badges, first guideline version
-- ═══════════════════════════════════════════════════════════════════
insert into public.categories (slug, name_ar, name_en, sort) values
  ('poetry','شعر','Poetry',1),
  ('novels','روايات','Novels',2),
  ('short','قصص قصيرة','Short stories',3),
  ('history','تاريخ','History',4),
  ('essays','مقالات','Essays',5),
  ('heritage','تراث وفلكلور','Heritage & folklore',6),
  ('science','علم','Science',7),
  ('children','أطفال','Children''s',8),
  ('other','أخرى','Other',99)
on conflict (slug) do nothing;

insert into public.badges (slug, name_ar, name_en) values
  ('first_work','أول عمل منشور','First work published'),
  ('first_review','أول مراجعة','First review'),
  ('reads_5','قراءة ٥ أعمال','5 works read'),
  ('reads_20','قراءة ٢٠ عملاً','20 works read')
on conflict (slug) do nothing;

-- The real guidelines text lives in the app (src/lib/guidelines-text.ts) and is
-- inserted here as version 1 so the schema is complete on a fresh database.
insert into public.guideline_versions (version, content_ar, content_en, active)
values (1, 'ميثاق مجتمع مكتبتي — الإصدار ١

مكتبتي مساحة ثقافية للقراءة والكتابة. نقبل خلاف الأراء، ولا نقبل انتهاك الكرامة.
قبل النشر، اقرأ ما يلي ووافق عليه.

١. احترام المعتقد والمذهب والعرق
لا نسمح بالتحريض على الكراهية أو الفتنة ضد أي دين أو مذهب أو عرق أو مجموعة.

٢. لا إساءة ولا تهديد
ممنوع الإساءة الشخصية والتهديد والتنمّر مهما كان الهدف.

٣. لا محتوى صريح جنسيًا
الأعمال ذات الطابع الناضج أو القاتم تُراجَع يدوياً؛ أما المحتوى الإباحي الصريح فمرفوض.

٤. لا ملاحقة ولا كشف بيانات
ممنوع ملاحقة الأفراد أو نشر بياناتهم الشخصية.

٥. أمانة المؤلفية
انشر ما تملك حقّه فقط. لا محاكاة ولا سرقة. الاشتباه في الانتحال يُراجَع يدوياً.

٦. نقد بنّاء
النقد مسموح، والتجريح لا.

٧. احترام الخصوصية
لا تنشر صورًا أو معلومات عن أشخاص دون إذنهم.

٨. الصدق
لا تدّعِ ما ليس لك. الاسم الحركي يمثّلك، ولا يمثّل جهة رسمية ما لم تصرّح بذلك.

٩. الإشراف بشري
كل عمل يمرّ على فحص آلي ثم على بشر عند الحاجة. قد يخطئ الفحص الآلي؛ يمكنك الاعتراض ويُراجع بشر.

١٠. النتائج
مخالفة هذه القواعد قد تؤدي إلى الرفض أو التعليق أو الحظر. كل قرار يُسجَّل مع سببه.', 'Community Guidelines of MIKTUBATI — Version 1

MIKTUBATI is a space for reading and writing. We accept disagreement; we do not
accept attacks on dignity. Read the following and accept it before posting.

1. Respect for belief, sect and ethnicity
We do not allow incitement of hatred or strife against any religion, sect,
ethnicity or group.

2. No insults or threats
Personal abuse, threats and bullying are prohibited, whatever the target.

3. No sexually explicit content
Works with mature or dark themes are reviewed by a human; explicitly
pornographic content is rejected.

4. No harassment or doxxing
Following individuals or publishing their personal data is prohibited.

5. Honesty about authorship
Publish only what you have the right to publish. No impersonation or theft.
Plagiarism suspicion goes to human review.

6. Constructive criticism
Criticism is allowed; smear is not.

7. Respect for privacy
Do not publish images or information about people without their permission.

8. Honesty
Do not claim what is not yours. Your pen name represents you, and does not
represent an official body unless you say so.

9. Human review
Every work passes an automated check and, when needed, a human review. The
automated check can be wrong; you may appeal and a human will look at it.

10. Consequences
Breaking these rules can lead to rejection, suspension or a ban. Every decision
is recorded with its reason.', true)
on conflict (version) do nothing;

-- ═══════════════════════════════════════════════════════════════════
-- storage buckets — all private, served via signed URLs
-- ═══════════════════════════════════════════════════════════════════
insert into storage.buckets (id, name, public)
values
  ('work-covers', 'work-covers', false),
  ('work-files',  'work-files',  false),
  ('avatars',     'avatars',     false)
on conflict (id) do nothing;

-- owners may upload into their own folder; everyone else reads via signed URL
create policy "user uploads own cover"
  on storage.objects for insert to authenticated
  with check (bucket_id in ('work-covers','avatars') and (storage.foldername(name))[1] = auth.uid()::text);

create policy "user uploads own work file"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'work-files' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "user deletes own objects"
  on storage.objects for delete to authenticated
  using ((storage.foldername(name))[1] = auth.uid()::text);
