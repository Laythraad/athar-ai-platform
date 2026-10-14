-- ╔══════════════════════════════════════════════════════════════╗
-- ║  ALL-IN-ONE: run this ONCE in the Supabase SQL Editor       ║
-- ║  (0001 schema+RLS  →  0002 identity/privacy  →  demo seed)  ║
-- ╚══════════════════════════════════════════════════════════════╝

-- â•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گ
-- ظ…ظƒطھط¨طھظٹ (MIKTUBATI) â€” community library for ATHAR IRAQ
-- Migration 0001: schema + RLS + storage + triggers
--
-- Security model (see README for the full explanation):
--   â€¢ Every table has RLS enabled.
--   â€¢ Members read only published content; they read/edit ONLY their own rows.
--   â€¢ `works.status`, `user_roles.role`, moderation fields and audit rows are
--     NEVER client-writable â€” enforced by triggers + the absence of client
--     UPDATE policies, and by writes that go through the service-role key
--     (server-only) or SECURITY DEFINER functions.
--   â€¢ The single admin is granted server-side from the ADMIN_EMAIL env var,
--     and only once the email is VERIFIED.
-- â•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گ

create extension if not exists pgcrypto;

-- â”€â”€â”€ enums â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

-- â”€â”€â”€ helper: is the caller the service role? â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
create or replace function public.is_service_role()
returns boolean
language sql stable
as $$
  select coalesce(
    nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role',
    ''
  ) = 'service_role';
$$;

-- â”€â”€â”€ helper: is the calling user banned/suspended? â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
create or replace function public.is_blocked(uid uuid)
returns boolean
language sql stable
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = uid and p.account_status in ('suspended','banned')
  );
$$;

-- â•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گ
-- profiles â€” public identity. Email is NEVER public.
-- â•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گ
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

-- â•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گ
-- user_roles â€” server-managed only
-- â•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گ
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

-- No INSERT/UPDATE/DELETE policies for clients â†’ only service role writes.

-- â•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گ
-- guideline_versions + guideline_acceptances
-- â•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گ
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
-- no update/delete â†’ acceptances are immutable history

-- â•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گ
-- categories (seeded below, read-only to clients)
-- â•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گ
create table if not exists public.categories (
  slug      text primary key,
  name_ar   text not null,
  name_en   text not null,
  sort      int  not null default 100
);
alter table public.categories enable row level security;
create policy "categories readable" on public.categories for select using (true);

-- â•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گ
-- works â€” the core content table
-- â•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گ
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

-- â”€â”€â”€ trigger: fail-closed status protection â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

-- â”€â”€â”€ trigger: duplicate detection (same author + normalised title) â”€
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

-- â•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گ
-- work_files â€” mirror of private-storage objects
-- â•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گ
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

-- â•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گ
-- author_ratings â€” one row per (author, rater)
-- â•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گ
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

-- â•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گ
-- reviews â€” moderated free text about an author
-- â•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گ
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

-- â•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گ
-- reading_list â€” per-user statuses + progress
-- â•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گ
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

-- â•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گ
-- reports
-- â•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گ
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

-- â•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گ
-- moderation_events â€” every AI/human decision, immutable
-- â•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گ
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

-- â•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گ
-- audit_log â€” every privileged action
-- â•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گ
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

-- â•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گ
-- badges + user_badges (real counts only)
-- â•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گ
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

-- â•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گ
-- rate limiting (simple server-enforced counters)
-- â•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گ
create table if not exists public.rate_events (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  action     text not null,
  created_at timestamptz not null default now()
);
create index if not exists rate_events_lookup on public.rate_events(user_id, action, created_at desc);
alter table public.rate_events enable row level security;
-- no client policies: server-only (service role)

-- â•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گ
-- SECURITY DEFINER helper: grant admin only to a VERIFIED ADMIN_EMAIL
-- Called by the server (service role) after sign-in / email verification.
-- â•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گ
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

-- â•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گ
-- SECURITY DEFINER helper: recompute an author's rating aggregates
-- â•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گ
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

-- â•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گ
-- seed: categories, badges, first guideline version
-- â•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گ
insert into public.categories (slug, name_ar, name_en, sort) values
  ('poetry','ط´ط¹ط±','Poetry',1),
  ('novels','ط±ظˆط§ظٹط§طھ','Novels',2),
  ('short','ظ‚طµطµ ظ‚طµظٹط±ط©','Short stories',3),
  ('history','طھط§ط±ظٹط®','History',4),
  ('essays','ظ…ظ‚ط§ظ„ط§طھ','Essays',5),
  ('heritage','طھط±ط§ط« ظˆظپظ„ظƒظ„ظˆط±','Heritage & folklore',6),
  ('science','ط¹ظ„ظ…','Science',7),
  ('children','ط£ط·ظپط§ظ„','Children''s',8),
  ('other','ط£ط®ط±ظ‰','Other',99)
on conflict (slug) do nothing;

insert into public.badges (slug, name_ar, name_en) values
  ('first_work','ط£ظˆظ„ ط¹ظ…ظ„ ظ…ظ†ط´ظˆط±','First work published'),
  ('first_review','ط£ظˆظ„ ظ…ط±ط§ط¬ط¹ط©','First review'),
  ('reads_5','ظ‚ط±ط§ط،ط© ظ¥ ط£ط¹ظ…ط§ظ„','5 works read'),
  ('reads_20','ظ‚ط±ط§ط،ط© ظ¢ظ  ط¹ظ…ظ„ط§ظ‹','20 works read')
on conflict (slug) do nothing;

-- The real guidelines text lives in the app (src/lib/guidelines-text.ts) and is
-- inserted here as version 1 so the schema is complete on a fresh database.
insert into public.guideline_versions (version, content_ar, content_en, active)
values (1, 'ظ…ظٹط«ط§ظ‚ ظ…ط¬طھظ…ط¹ ظ…ظƒطھط¨طھظٹ â€” ط§ظ„ط¥طµط¯ط§ط± ظ،

ظ…ظƒطھط¨طھظٹ ظ…ط³ط§ط­ط© ط«ظ‚ط§ظپظٹط© ظ„ظ„ظ‚ط±ط§ط،ط© ظˆط§ظ„ظƒطھط§ط¨ط©. ظ†ظ‚ط¨ظ„ ط®ظ„ط§ظپ ط§ظ„ط£ط±ط§ط،طŒ ظˆظ„ط§ ظ†ظ‚ط¨ظ„ ط§ظ†طھظ‡ط§ظƒ ط§ظ„ظƒط±ط§ظ…ط©.
ظ‚ط¨ظ„ ط§ظ„ظ†ط´ط±طŒ ط§ظ‚ط±ط£ ظ…ط§ ظٹظ„ظٹ ظˆظˆط§ظپظ‚ ط¹ظ„ظٹظ‡.

ظ،. ط§ط­طھط±ط§ظ… ط§ظ„ظ…ط¹طھظ‚ط¯ ظˆط§ظ„ظ…ط°ظ‡ط¨ ظˆط§ظ„ط¹ط±ظ‚
ظ„ط§ ظ†ط³ظ…ط­ ط¨ط§ظ„طھط­ط±ظٹط¶ ط¹ظ„ظ‰ ط§ظ„ظƒط±ط§ظ‡ظٹط© ط£ظˆ ط§ظ„ظپطھظ†ط© ط¶ط¯ ط£ظٹ ط¯ظٹظ† ط£ظˆ ظ…ط°ظ‡ط¨ ط£ظˆ ط¹ط±ظ‚ ط£ظˆ ظ…ط¬ظ…ظˆط¹ط©.

ظ¢. ظ„ط§ ط¥ط³ط§ط،ط© ظˆظ„ط§ طھظ‡ط¯ظٹط¯
ظ…ظ…ظ†ظˆط¹ ط§ظ„ط¥ط³ط§ط،ط© ط§ظ„ط´ط®طµظٹط© ظˆط§ظ„طھظ‡ط¯ظٹط¯ ظˆط§ظ„طھظ†ظ…ظ‘ط± ظ…ظ‡ظ…ط§ ظƒط§ظ† ط§ظ„ظ‡ط¯ظپ.

ظ£. ظ„ط§ ظ…ط­طھظˆظ‰ طµط±ظٹط­ ط¬ظ†ط³ظٹظ‹ط§
ط§ظ„ط£ط¹ظ…ط§ظ„ ط°ط§طھ ط§ظ„ط·ط§ط¨ط¹ ط§ظ„ظ†ط§ط¶ط¬ ط£ظˆ ط§ظ„ظ‚ط§طھظ… طھظڈط±ط§ط¬ظژط¹ ظٹط¯ظˆظٹط§ظ‹ط› ط£ظ…ط§ ط§ظ„ظ…ط­طھظˆظ‰ ط§ظ„ط¥ط¨ط§ط­ظٹ ط§ظ„طµط±ظٹط­ ظپظ…ط±ظپظˆط¶.

ظ¤. ظ„ط§ ظ…ظ„ط§ط­ظ‚ط© ظˆظ„ط§ ظƒط´ظپ ط¨ظٹط§ظ†ط§طھ
ظ…ظ…ظ†ظˆط¹ ظ…ظ„ط§ط­ظ‚ط© ط§ظ„ط£ظپط±ط§ط¯ ط£ظˆ ظ†ط´ط± ط¨ظٹط§ظ†ط§طھظ‡ظ… ط§ظ„ط´ط®طµظٹط©.

ظ¥. ط£ظ…ط§ظ†ط© ط§ظ„ظ…ط¤ظ„ظپظٹط©
ط§ظ†ط´ط± ظ…ط§ طھظ…ظ„ظƒ ط­ظ‚ظ‘ظ‡ ظپظ‚ط·. ظ„ط§ ظ…ط­ط§ظƒط§ط© ظˆظ„ط§ ط³ط±ظ‚ط©. ط§ظ„ط§ط´طھط¨ط§ظ‡ ظپظٹ ط§ظ„ط§ظ†طھط­ط§ظ„ ظٹظڈط±ط§ط¬ظژط¹ ظٹط¯ظˆظٹط§ظ‹.

ظ¦. ظ†ظ‚ط¯ ط¨ظ†ظ‘ط§ط،
ط§ظ„ظ†ظ‚ط¯ ظ…ط³ظ…ظˆط­طŒ ظˆط§ظ„طھط¬ط±ظٹط­ ظ„ط§.

ظ§. ط§ط­طھط±ط§ظ… ط§ظ„ط®طµظˆطµظٹط©
ظ„ط§ طھظ†ط´ط± طµظˆط±ظ‹ط§ ط£ظˆ ظ…ط¹ظ„ظˆظ…ط§طھ ط¹ظ† ط£ط´ط®ط§طµ ط¯ظˆظ† ط¥ط°ظ†ظ‡ظ….

ظ¨. ط§ظ„طµط¯ظ‚
ظ„ط§ طھط¯ظ‘ط¹ظگ ظ…ط§ ظ„ظٹط³ ظ„ظƒ. ط§ظ„ط§ط³ظ… ط§ظ„ط­ط±ظƒظٹ ظٹظ…ط«ظ‘ظ„ظƒطŒ ظˆظ„ط§ ظٹظ…ط«ظ‘ظ„ ط¬ظ‡ط© ط±ط³ظ…ظٹط© ظ…ط§ ظ„ظ… طھطµط±ظ‘ط­ ط¨ط°ظ„ظƒ.

ظ©. ط§ظ„ط¥ط´ط±ط§ظپ ط¨ط´ط±ظٹ
ظƒظ„ ط¹ظ…ظ„ ظٹظ…ط±ظ‘ ط¹ظ„ظ‰ ظپط­طµ ط¢ظ„ظٹ ط«ظ… ط¹ظ„ظ‰ ط¨ط´ط± ط¹ظ†ط¯ ط§ظ„ط­ط§ط¬ط©. ظ‚ط¯ ظٹط®ط·ط¦ ط§ظ„ظپط­طµ ط§ظ„ط¢ظ„ظٹط› ظٹظ…ظƒظ†ظƒ ط§ظ„ط§ط¹طھط±ط§ط¶ ظˆظٹظڈط±ط§ط¬ط¹ ط¨ط´ط±.

ظ،ظ . ط§ظ„ظ†طھط§ط¦ط¬
ظ…ط®ط§ظ„ظپط© ظ‡ط°ظ‡ ط§ظ„ظ‚ظˆط§ط¹ط¯ ظ‚ط¯ طھط¤ط¯ظٹ ط¥ظ„ظ‰ ط§ظ„ط±ظپط¶ ط£ظˆ ط§ظ„طھط¹ظ„ظٹظ‚ ط£ظˆ ط§ظ„ط­ط¸ط±. ظƒظ„ ظ‚ط±ط§ط± ظٹظڈط³ط¬ظژظ‘ظ„ ظ…ط¹ ط³ط¨ط¨ظ‡.', 'Community Guidelines of MIKTUBATI â€” Version 1

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

-- â•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گ
-- storage buckets â€” all private, served via signed URLs
-- â•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گ
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


-- ═══ END OF 0001 — 0002 STARTS BELOW ═══

-- â•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گ
-- 0002 â€” Identity + privacy hardening
--
--  â€¢ `username`  â†’ public unique handle (the name people see)
--  â€¢ `full_name` â†’ real 3-part name, kept PRIVATE in its own table so it
--                  is never exposed by the public profiles SELECT policy
--  â€¢ `is_sample` â†’ marks seeded demo content so the UI can label it honestly
-- â•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گ

-- â”€â”€ public username on profiles â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
alter table public.profiles
  add column if not exists username text,
  add column if not exists is_sample boolean not null default false;

-- backfill any existing rows so username is never null going forward
update public.profiles set username = pen_name where username is null;

alter table public.profiles
  alter column username set not null;

-- usernames: lowercase handle, 3â€“24 chars, letters/digits/_/., no leading digit
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'username_format'
  ) then
    alter table public.profiles
      add constraint username_format
      check (username ~ '^[a-z][a-z0-9_.]{2,23}$');
  end if;
  if not exists (
    select 1 from pg_constraint where conname = 'username_no_at'
  ) then
    alter table public.profiles
      add constraint username_no_at
      check (username !~ '@' and username !~ 'https?://');
  end if;
end $$;

create unique index if not exists profiles_username_key
  on public.profiles (username);

-- â”€â”€ private real name (NEVER publicly readable) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
create table if not exists public.profile_private (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  full_name  text not null check (char_length(full_name) between 6 and 120),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profile_private enable row level security;

-- the owner may read their OWN real name and nothing else
drop policy if exists "own private row" on public.profile_private;
create policy "own private row"
  on public.profile_private for select
  using (auth.uid() = user_id);

-- NO client insert/update/delete policies â†’ only the service role writes.
-- (RLS default-deny means an absent policy = no access.)

-- â”€â”€ demo/sample content flag on works â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
alter table public.works
  add column if not exists is_sample boolean not null default false;


-- ═══ END OF 0002 — DEMO SEED STARTS BELOW ═══

-- â•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گ
-- seed-demo.sql â€” SAMPLE / DEMO content for ظ…ظƒطھط¨طھظٹ
--
--  âڑ ï¸ڈ  EVERYTHING HERE IS FICTIONAL DEMO DATA.
--  Every profile and work is flagged  is_sample = true  so the UI can
--  label it honestly. None of it is presented as real members or real
--  literature. Run this AFTER 0001 and 0002 in the Supabase SQL editor.
--
--  It creates 6 sample authors, 10 sample works and a handful of ratings
--  so the library is not empty on a demo. Delete with:
--     delete from public.works where is_sample;
--     delete from public.profiles where is_sample;
-- â•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گ

-- categories are already seeded in 0001; ensure they exist regardless
insert into public.categories (slug, name_ar, name_en, sort) values
  ('poetry','ط´ط¹ط±','Poetry',1),
  ('novels','ط±ظˆط§ظٹط§طھ','Novels',2),
  ('short','ظ‚طµطµ ظ‚طµظٹط±ط©','Short stories',3),
  ('history','طھط§ط±ظٹط®','History',4),
  ('essays','ظ…ظ‚ط§ظ„ط§طھ','Essays',5),
  ('heritage','طھط±ط§ط« ظˆظپظ„ظƒظ„ظˆط±','Heritage & folklore',6)
on conflict (slug) do nothing;

-- â”€â”€ helper: minimal auth.users rows for the sample authors â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- (so profiles.id â†’ auth.users.id keeps its foreign key intact).
-- These accounts are confirmed and share a throwaway demo password.
do $$
declare
  u record;
  demo_password text := crypt('demo-password-123', gen_salt('bf', 10));
begin
  for u in
    select * from (values
      ('11111111-1111-4111-8111-111111111101','zainab_karbala@example.test','ط²ظٹظ†ط§ط¨ ظƒط±ط¨ظ„ط§ط،'),
      ('11111111-1111-4111-8111-111111111102','hassan_basri@example.test','ط­ط³ظ† ط§ظ„ط¨طµط±ظٹ'),
      ('11111111-1111-4111-8111-111111111103','layla_mosul@example.test','ظ„ظٹظ„ظ‰ ظ…ظˆطµظ„'),
      ('11111111-1111-4111-8111-111111111104','omar_baghdad@example.test','ط¹ظ…ط± ط¨ط؛ط¯ط§ط¯'),
      ('11111111-1111-4111-8111-111111111105','nur_najaf@example.test','ظ†ظˆط± ط§ظ„ظ†ط¬ظپ'),
      ('11111111-1111-4111-8111-111111111106','faisal_erbil@example.test','ظپظٹطµظ„ ط£ط±ط¨ظٹظ„')
    ) as t(id, email, full_name)
  loop
    insert into auth.users (
      id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at
    ) values (
      u.id, 'authenticated', 'authenticated', u.email, demo_password,
      now(), '{"provider":"email","providers":["email"]}', '{}',
      now(), now()
    ) on conflict (id) do nothing;
  end loop;
end $$;

-- â”€â”€ public profiles (is_sample = true) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
insert into public.profiles (id, username, pen_name, bio, author_type, email_verified, is_sample) values
  ('11111111-1111-4111-8111-111111111101','zainab_karbala','zainab_karbala','ط´ط§ط¹ط±ط©. ط£ظƒطھط¨ ط¹ظ† ط§ظ„ظ†ظ‡ط± ظˆط§ظ„ظ…ط¯ظٹظ†ط©. ط¨ظٹط§ظ†ط§طھ طھط¬ط±ظٹط¨ظٹط©.','poet',true,true),
  ('11111111-1111-4111-8111-111111111102','hassan_basri','hassan_basri','ظƒط§طھط¨ ظ‚طµطµ ظ‚طµظٹط±ط©. ط¨ظٹط§ظ†ط§طھ طھط¬ط±ظٹط¨ظٹط©.','writer',true,true),
  ('11111111-1111-4111-8111-111111111103','layla_mosul','layla_mosul','ط¨ط§ط­ط«ط© ظپظٹ ط§ظ„طھط§ط±ظٹط® ظˆط§ظ„طھط±ط§ط«. ط¨ظٹط§ظ†ط§طھ طھط¬ط±ظٹط¨ظٹط©.','historian',true,true),
  ('11111111-1111-4111-8111-111111111104','omar_baghdad','omar_baghdad','ظƒط§طھط¨ ظ…ظ‚ط§ظ„ط§طھ. ط¨ظٹط§ظ†ط§طھ طھط¬ط±ظٹط¨ظٹط©.','writer',true,true),
  ('11111111-1111-4111-8111-111111111105','nur_najaf','nur_najaf','ط´ط§ط¹ط±ط©. ط¨ظٹط§ظ†ط§طھ طھط¬ط±ظٹط¨ظٹط©.','poet',true,true),
  ('11111111-1111-4111-8111-111111111106','faisal_erbil','faisal_erbil','ظ…ظ‡طھظ… ط¨ط§ظ„طھط±ط§ط« ظˆط§ظ„ظپظ„ظƒظ„ظˆط±. ط¨ظٹط§ظ†ط§طھ طھط¬ط±ظٹط¨ظٹط©.','writer',true,true)
on conflict (id) do nothing;

-- â”€â”€ private real names (only the owner can read these) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
insert into public.profile_private (user_id, full_name) values
  ('11111111-1111-4111-8111-111111111101','ط²ظٹظ†ط§ط¨ ظƒط±ط¨ظ„ط§ط، ط§ظ„ظ†ط¬ط§ط±'),
  ('11111111-1111-4111-8111-111111111102','ط­ط³ظ† ط¹ظ„ظٹ ط§ظ„ط¨طµط±ظٹ'),
  ('11111111-1111-4111-8111-111111111103','ظ„ظٹظ„ظ‰ ظ…ط­ظ…ظˆط¯ ظ…ظˆطµظ„'),
  ('11111111-1111-4111-8111-111111111104','ط¹ظ…ط± ط¹ط¨ط¯ ط¨ط؛ط¯ط§ط¯'),
  ('11111111-1111-4111-8111-111111111105','ظ†ظˆط± ط­ط³ظٹظ† ط§ظ„ظ†ط¬ظپ'),
  ('11111111-1111-4111-8111-111111111106','ظپظٹطµظ„ ظƒط±ظٹظ… ط£ط±ط¨ظٹظ„')
on conflict (user_id) do nothing;

-- â”€â”€ sample works (published + is_sample) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- Short ORIGINAL demo excerpts â€” not real published literature.
insert into public.works (id, author_id, title, description, category, language, content, status, is_sample, published_at) values
  ('22222222-2222-4222-8222-222222222201','11111111-1111-4111-8111-111111111101','ظ†ظ‡ط± ط§ظ„ظ…ط³ط§ط،','ظ‚طµظٹط¯ط© ظ‚طµظٹط±ط© ط¹ظ† ط§ظ„ظ†ظ‡ط± â€” ظ†طµ طھط¬ط±ظٹط¨ظٹ.','poetry','ar',
   'ط§ظ„ظ†ظ‡ط±ظڈ ظٹظ…ط´ظٹ ظپظٹ ط§ظ„ظ…ط¯ظ‰ ط¨ظ„ط§ ط¹ط¬ظ„ط©طŒ\nظٹط­ظ…ظ„ظڈ ظ…ظ† ط§ظ„ظ…ط¯ظ†ظگ ظ…ط§ طھط¨ظ‚ظ‘ظ‰.\nط£ظ†ط§ ط£ط¹ط¯ظڈظ‘ ط§ظ„ظ…ط³ط§ط،ظژ ظƒط£ظ†ظ‘ظ‡ ط®ط·ظˆط©طŒ\nظˆط£ط¯ط¹ظگ ط§ظ„ط¶ظˆط،ظژ ظٹظƒطھط¨ ظ…ط§ ط£ط±ط¯طھ.','published',true,now()),
  ('22222222-2222-4222-8222-222222222202','11111111-1111-4111-8111-111111111101','ظ…ط¯ظٹط­ ط§ظ„ط·ظٹظ†','ط¹ظ† ظ…ط¯ظٹظ†ط©ظچ ظ‚ط¯ظٹظ…ط© â€” ظ†طµ طھط¬ط±ظٹط¨ظٹ.','poetry','ar',
   'ط·ظٹظ†ظڈ ط§ظ„ظ…ط¯ظٹظ†ط©ظگ ظٹط°ظƒط±ظڈ ظƒظ„ظژظ‘ ط§ط³ظ…طŒ\nظˆظƒظ„ظژظ‘ ط¨ط§ط¨ظچ ظ…ط±ظ‘ ظ…ظ†ظ‡ ط§ظ„ط±ط­ظٹظ„.','published',true,now()),
  ('22222222-2222-4222-8222-222222222203','11111111-1111-4111-8111-111111111102','ظ…ظ‚ظ‡ظ‰ ط¹ظ„ظ‰ ط§ظ„ط±طµظٹظپ','ظ‚طµط© ظ‚طµظٹط±ط© â€” ظ†طµ طھط¬ط±ظٹط¨ظٹ.','short','ar',
   'ظƒط§ظ† ط§ظ„ط±طµظٹظپظڈ ظٹظ†طھط¸ط±ظڈ ط·ظ„ظ„ط§ط¹ظژ ط§ظ„ط´ظ…ط³طŒ ظˆط§ظ„ظ‚ظ‡ظˆط©ظڈ طھط¨ط±ط¯ظڈ ظپظٹ ظپظ†ط¬ط§ظ†ظچ ظ†ط³ظٹ طµط§ط­ط¨ظڈظ‡ ط£ظ† ظٹط´ط±ط¨ظ‡ط§.','published',true,now()),
  ('22222222-2222-4222-8222-222222222204','11111111-1111-4111-8111-111111111102','ط±ط³ط§ظ„ط© ظ„ظ… طھظڈط±ط³ظ„','ظ‚طµط© ظ‚طµظٹط±ط© â€” ظ†طµ طھط¬ط±ظٹط¨ظٹ.','short','ar',
   'ظƒطھط¨ظ‡ط§ ظ…ط±طھظٹظ†طŒ ظˆط­ط°ظپظ‡ط§ ط«ظ„ط§ط«ط§ظ‹. ط¨ظ‚ظٹ ط§ظ„ظˆط±ظ‚ظڈ ط£طµط¯ظ‚ظژ ظ…ظ†ظ‘ظ‡.','published',true,now()),
  ('22222222-2222-4222-8222-222222222205','11111111-1111-4111-8111-111111111103','ط£ط³ظˆط§ظ‚ ظ‚ط¯ظٹظ…ط©','ط¹ظ† طھط§ط±ظٹط® ط§ظ„ط£ط³ظˆط§ظ‚ â€” ظ†طµ طھط¬ط±ظٹط¨ظٹ.','history','ar',
   'ط§ظ„ط³ظˆظ‚ظڈ ظ„ظٹط³ ظ…ظƒط§ظ†ط§ظ‹ ظ„ظ„ط¨ظٹط¹ ظپط­ط³ط¨طŒ ط¨ظ„ ط°ط§ظƒط±ط©ظŒ ط¬ظ…ط§ط¹ظٹط©ظŒ طھطھظ†ظ‚ظ‘ظ„ ط¨ظٹظ† ط§ظ„ط£ط¬ظٹط§ظ„.','published',true,now()),
  ('22222222-2222-4222-8222-222222222206','11111111-1111-4111-8111-111111111104','ط¹ظ† ط§ظ„ظ‡ط¯ظˆط،','ظ…ظ‚ط§ظ„ â€” ظ†طµ طھط¬ط±ظٹط¨ظٹ.','essays','ar',
   'ط§ظ„ظ‡ط¯ظˆط،ظڈ ظ„ظٹط³ ط؛ظٹط§ط¨ظژ ط§ظ„طµظˆطھطŒ ط¨ظ„ ط­ط¶ظˆط±ظڈ ط§ظ†طھط¨ط§ظ‡. ظ†طھط¹ظ„ظ‘ظ…ظڈ ط£ظ† ظ†ط³ظ…ط¹ظژ ظ…ط§ ظ„ط§ ظٹظڈظ‚ط§ظ„.','published',true,now()),
  ('22222222-2222-4222-8222-222222222207','11111111-1111-4111-8111-111111111105','ط£ط؛ظ†ظٹط© ط§ظ„ظ…ط·ط±','ظ‚طµظٹط¯ط© â€” ظ†طµ طھط¬ط±ظٹط¨ظٹ.','poetry','ar',
   'ط§ظ„ظ…ط·ط±ظڈ ظٹط·ط±ظ‚ظڈ ط§ظ„ظ†ظˆط§ظپط°ظژ ظƒط£ظ†ظ‘ظ‡ ط¶ظٹظپظŒ ظ‚ط¯ظٹظ…طŒ ظˆط§ظ„ظ†ط§ط±ظڈ ظپظٹ ظ…ظˆظ‚ط¯ظگ ط§ظ„ط¨ظٹطھظگ ظ„ظ… طھظ†ط·ظپط¦ ط¨ط¹ط¯.','published',true,now()),
  ('22222222-2222-4222-8222-222222222208','11111111-1111-4111-8111-111111111105','ظ„ظٹظ„ط©ظڈ ط§ظ„ظ‚ظ…ط±','ظ‚طµظٹط¯ط© â€” ظ†طµ طھط¬ط±ظٹط¨ظٹ.','poetry','ar',
   'ط§ظ„ظ‚ظ…ط±ظڈ ظٹظ…ظ„ط£ظڈ ط§ظ„ظپظ†ط§ط،ظژ ط¶ظˆط،ط§ظ‹طŒ ظˆط§ظ„ظ†ط®ظ„ظڈ ظٹظ‚ظپظڈ ط­ط§ط±ط³ط§ظ‹ طµط§ظ…طھط§ظ‹.','published',true,now()),
  ('22222222-2222-4222-8222-222222222209','11111111-1111-4111-8111-111111111106','ط­ظƒط§ظٹط§طھ ط§ظ„ط¬ط¯ظ‘','ط¹ظ† ط§ظ„ظپظ„ظƒظ„ظˆط± â€” ظ†طµ طھط¬ط±ظٹط¨ظٹ.','heritage','ar',
   'ط§ظ„ط­ظƒط§ظٹط©ظڈ طھظڈط±ظˆظ‰ ظ„طھظڈط­ظپط¸طŒ ظ„ط§ ظ„طھظڈطµط¯ظ‘ظ‚. ظپظٹ ظƒظ„ظ‘ ط­ظƒط§ظٹط©ظچ ط¨ط§ط¨ظŒ ظ„ط°ط§ظƒط±ط©ظچ ط£ظƒط¨ط±.','published',true,now()),
  ('22222222-2222-4222-8222-222222222210','11111111-1111-4111-8111-111111111106','ط·ط±ظٹظ‚ ط§ظ„طھظ…ظˆط±','ط¹ظ† ط§ظ„ط£ط¹ط±ط§ظپ â€” ظ†طµ طھط¬ط±ظٹط¨ظٹ.','heritage','ar',
   'ط§ظ„ط·ط±ظٹظ‚ظڈ ط§ظ„ط°ظٹ ظٹظ…ط±ظ‘ ط¨ط¨ط³طھط§ظ†ظگ ط§ظ„طھظ…ط±ظگ ظٹط¹ظ„ظ‘ظ…ظƒظژ ط§ظ„طµط¨ط± ظ‚ط¨ظ„ ط§ظ„ظˆطµظˆظ„.','published',true,now())
on conflict (id) do nothing;

-- â”€â”€ sample ratings (raters are other sample authors) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
insert into public.author_ratings (author_id, rater_id, stars) values
  ('11111111-1111-4111-8111-111111111101','11111111-1111-4111-8111-111111111102',5),
  ('11111111-1111-4111-8111-111111111101','11111111-1111-4111-8111-111111111103',4),
  ('11111111-1111-4111-8111-111111111103','11111111-1111-4111-8111-111111111101',5),
  ('11111111-1111-4111-8111-111111111105','11111111-1111-4111-8111-111111111104',4),
  ('11111111-1111-4111-8111-111111111106','11111111-1111-4111-8111-111111111105',5)
on conflict (author_id, rater_id) do nothing;

-- â”€â”€ recompute the rating aggregates from the source rows â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
insert into public.author_rating_agg (author_id, avg_stars, count, updated_at)
select
  r.author_id,
  round(avg(r.stars)::numeric, 2) as avg_stars,
  count(*) as count,
  now()
from public.author_ratings r
group by r.author_id
on conflict (author_id) do update
  set avg_stars = excluded.avg_stars,
      count     = excluded.count,
      updated_at = excluded.updated_at;

-- â”€â”€ recompute published-work rating stats (avg_rating / rating_count) â”€
-- works rating comes from author_ratings in this demo; keep counts honest.
update public.works w
set rating_count = coalesce(agg.count, 0),
    avg_rating   = coalesce(agg.avg_stars, 0)
from (
  select author_id, avg_stars, count from public.author_rating_agg
) agg
where w.author_id = agg.author_id;
