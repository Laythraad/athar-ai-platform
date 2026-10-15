/* 0004 — My Library (private by default), Creative Studio, Cultural Passport.

   Design decisions:
   • library_items is OWNER-ONLY via RLS. No public policies. Visibility
     column exists for a future explicit share flow, default 'private'.
   • creative_works: drafts are owner-only; publishing to the community goes
     through the existing moderated /api/publish flow, never direct INSERT
     into works.
   • user_passport: owner-only visited-sites log.
   • All timestamps are plain timestamptz defaults. */

create table if not exists public.library_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('pdf', 'text', 'image', 'note')),
  title text not null check (char_length(title) between 1 and 200),
  file_path text,
  file_mime text,
  file_size bigint,
  content_text text,
  pages_total int,
  is_favorite boolean not null default false,
  last_page int not null default 1,
  last_opened_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists library_items_user_idx
  on public.library_items (user_id, created_at desc);

create table if not exists public.library_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  item_id uuid not null references public.library_items (id) on delete cascade,
  page int,
  body text not null check (char_length(body) between 1 and 5000),
  created_at timestamptz not null default now()
);

create index if not exists library_notes_item_idx
  on public.library_notes (item_id, page);

create table if not exists public.library_bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  item_id uuid not null references public.library_items (id) on delete cascade,
  page int not null,
  label text,
  created_at timestamptz not null default now(),
  unique (item_id, page, user_id)
);

create table if not exists public.creative_works (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('poem', 'story', 'note')),
  title text not null default '' check (char_length(title) <= 200),
  body text not null default '' check (char_length(body) <= 100000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists creative_works_user_idx
  on public.creative_works (user_id, updated_at desc);

create table if not exists public.user_passport (
  user_id uuid not null references auth.users (id) on delete cascade,
  site_id text not null,
  visited_at timestamptz not null default now(),
  primary key (user_id, site_id)
);

/* ── RLS: owner-only everywhere ───────────────────────────────────── */

alter table public.library_items enable row level security;
alter table public.library_notes enable row level security;
alter table public.library_bookmarks enable row level security;
alter table public.creative_works enable row level security;
alter table public.user_passport enable row level security;

drop policy if exists "library_items_own" on public.library_items;
create policy "library_items_own" on public.library_items
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "library_notes_own" on public.library_notes;
create policy "library_notes_own" on public.library_notes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "library_bookmarks_own" on public.library_bookmarks;
create policy "library_bookmarks_own" on public.library_bookmarks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "creative_works_own" on public.creative_works;
create policy "creative_works_own" on public.creative_works
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "user_passport_own" on public.user_passport;
create policy "user_passport_own" on public.user_passport
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

/* ── storage: private library-files bucket (owner prefix only) ────── */

insert into storage.buckets (id, name, public)
values ('library-files', 'library-files', false)
on conflict (id) do nothing;

drop policy if exists "library files insert own" on storage.objects;
create policy "library files insert own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'library-files' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "library files select own" on storage.objects;
create policy "library files select own" on storage.objects
  for select to authenticated
  using (bucket_id = 'library-files' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "library files delete own" on storage.objects;
create policy "library files delete own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'library-files' and (storage.foldername(name))[1] = auth.uid()::text);
