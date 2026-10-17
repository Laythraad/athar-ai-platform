-- Migration 0005: add 'space' category + interests support
-- Adds the missing space publishing category (FK for works.category)
-- and user_interests table for the onboarding interests picker.

-- ── 1. space category ──────────────────────────────────────────────
insert into public.categories (slug, name_ar, name_en, sort)
values ('space', 'الفضاء والفلك', 'Space & Astronomy', 9)
on conflict (slug) do nothing;

-- ── 2. user interests ──────────────────────────────────────────────
create table if not exists public.user_interests (
  user_id    uuid not null references auth.users(id) on delete cascade,
  interest   text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, interest)
);

alter table public.user_interests enable row level security;

create policy "own interests read"   on public.user_interests for select using (auth.uid() = user_id);
create policy "own interests write"  on public.user_interests for insert with check (auth.uid() = user_id);
create policy "own interests delete" on public.user_interests for delete using (auth.uid() = user_id);

-- ── 3. valid interest slugs (for CHECK constraint) ─────────────────
-- Keep in sync with int_* i18n keys in src/lib/i18n.ts
alter table public.user_interests drop constraint if exists user_interests_interest_check;
alter table public.user_interests add constraint user_interests_interest_check check (
  interest in (
    'space','science','history','literature','philosophy','art','music',
    'cuisine','architecture','nature','travel','tech','math','medicine',
    'physics','religion','photography','gaming','sports','economics'
  )
);

-- ── 4. regenerate ALL.sql marker ───────────────────────────────────
-- This file is 0005; ALL.sql must be regenerated to include it.
