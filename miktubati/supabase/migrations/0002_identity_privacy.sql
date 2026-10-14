-- ═══════════════════════════════════════════════════════════════════
-- 0002 — Identity + privacy hardening
--
--  • `username`  → public unique handle (the name people see)
--  • `full_name` → real 3-part name, kept PRIVATE in its own table so it
--                  is never exposed by the public profiles SELECT policy
--  • `is_sample` → marks seeded demo content so the UI can label it honestly
-- ═══════════════════════════════════════════════════════════════════

-- ── public username on profiles ────────────────────────────────────
alter table public.profiles
  add column if not exists username text,
  add column if not exists is_sample boolean not null default false;

-- backfill any existing rows so username is never null going forward
update public.profiles set username = pen_name where username is null;

alter table public.profiles
  alter column username set not null;

-- usernames: lowercase handle, 3–24 chars, letters/digits/_/., no leading digit
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

-- ── private real name (NEVER publicly readable) ────────────────────
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

-- NO client insert/update/delete policies → only the service role writes.
-- (RLS default-deny means an absent policy = no access.)

-- ── demo/sample content flag on works ──────────────────────────────
alter table public.works
  add column if not exists is_sample boolean not null default false;
