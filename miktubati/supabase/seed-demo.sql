-- ═══════════════════════════════════════════════════════════════════
-- seed-demo.sql — SAMPLE / DEMO content for مكتبتي
--
--  ⚠️  EVERYTHING HERE IS FICTIONAL DEMO DATA.
--  Every profile and work is flagged  is_sample = true  so the UI can
--  label it honestly. None of it is presented as real members or real
--  literature. Run this AFTER 0001 and 0002 in the Supabase SQL editor.
--
--  It creates 6 sample authors, 10 sample works and a handful of ratings
--  so the library is not empty on a demo. Delete with:
--     delete from public.works where is_sample;
--     delete from public.profiles where is_sample;
-- ═══════════════════════════════════════════════════════════════════

-- categories are already seeded in 0001; ensure they exist regardless
insert into public.categories (slug, name_ar, name_en, sort) values
  ('poetry','شعر','Poetry',1),
  ('novels','روايات','Novels',2),
  ('short','قصص قصيرة','Short stories',3),
  ('history','تاريخ','History',4),
  ('essays','مقالات','Essays',5),
  ('heritage','تراث وفلكلور','Heritage & folklore',6)
on conflict (slug) do nothing;

-- ── helper: minimal auth.users rows for the sample authors ──────────
-- (so profiles.id → auth.users.id keeps its foreign key intact).
-- These accounts are confirmed and share a throwaway demo password.
do $$
declare
  u record;
  demo_password text := crypt('demo-password-123', gen_salt('bf', 10));
begin
  for u in
    select * from (values
      ('11111111-1111-4111-8111-111111111101','zainab_karbala@example.test','زيناب كربلاء'),
      ('11111111-1111-4111-8111-111111111102','hassan_basri@example.test','حسن البصري'),
      ('11111111-1111-4111-8111-111111111103','layla_mosul@example.test','ليلى موصل'),
      ('11111111-1111-4111-8111-111111111104','omar_baghdad@example.test','عمر بغداد'),
      ('11111111-1111-4111-8111-111111111105','nur_najaf@example.test','نور النجف'),
      ('11111111-1111-4111-8111-111111111106','faisal_erbil@example.test','فيصل أربيل')
    ) as t(id, email, full_name)
  loop
    insert into auth.users (
      id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at
    ) values (
      u.id::uuid, 'authenticated', 'authenticated', u.email, demo_password,
      now(), '{"provider":"email","providers":["email"]}', '{}',
      now(), now()
    ) on conflict (id) do nothing;
  end loop;
end $$;

-- ── public profiles (is_sample = true) ──────────────────────────────
insert into public.profiles (id, username, pen_name, bio, author_type, email_verified, is_sample) values
  ('11111111-1111-4111-8111-111111111101','zainab_karbala','zainab_karbala','شاعرة. أكتب عن النهر والمدينة. بيانات تجريبية.','poet',true,true),
  ('11111111-1111-4111-8111-111111111102','hassan_basri','hassan_basri','كاتب قصص قصيرة. بيانات تجريبية.','writer',true,true),
  ('11111111-1111-4111-8111-111111111103','layla_mosul','layla_mosul','باحثة في التاريخ والتراث. بيانات تجريبية.','historian',true,true),
  ('11111111-1111-4111-8111-111111111104','omar_baghdad','omar_baghdad','كاتب مقالات. بيانات تجريبية.','writer',true,true),
  ('11111111-1111-4111-8111-111111111105','nur_najaf','nur_najaf','شاعرة. بيانات تجريبية.','poet',true,true),
  ('11111111-1111-4111-8111-111111111106','faisal_erbil','faisal_erbil','مهتم بالتراث والفلكلور. بيانات تجريبية.','writer',true,true)
on conflict (id) do nothing;

-- ── private real names (only the owner can read these) ──────────────
insert into public.profile_private (user_id, full_name) values
  ('11111111-1111-4111-8111-111111111101','زيناب كربلاء النجار'),
  ('11111111-1111-4111-8111-111111111102','حسن علي البصري'),
  ('11111111-1111-4111-8111-111111111103','ليلى محمود موصل'),
  ('11111111-1111-4111-8111-111111111104','عمر عبد بغداد'),
  ('11111111-1111-4111-8111-111111111105','نور حسين النجف'),
  ('11111111-1111-4111-8111-111111111106','فيصل كريم أربيل')
on conflict (user_id) do nothing;

-- ── sample works (published + is_sample) ────────────────────────────
-- Short ORIGINAL demo excerpts — not real published literature.
insert into public.works (id, author_id, title, description, category, language, content, status, is_sample, published_at) values
  ('22222222-2222-4222-8222-222222222201','11111111-1111-4111-8111-111111111101','نهر المساء','قصيدة قصيرة عن النهر — نص تجريبي.','poetry','ar',
   'النهرُ يمشي في المدى بلا عجلة،\nيحملُ من المدنِ ما تبقّى.\nأنا أعدُّ المساءَ كأنّه خطوة،\nوأدعِ الضوءَ يكتب ما أردت.','published',true,now()),
  ('22222222-2222-4222-8222-222222222202','11111111-1111-4111-8111-111111111101','مديح الطين','عن مدينةٍ قديمة — نص تجريبي.','poetry','ar',
   'طينُ المدينةِ يذكرُ كلَّ اسم،\nوكلَّ بابٍ مرّ منه الرحيل.','published',true,now()),
  ('22222222-2222-4222-8222-222222222203','11111111-1111-4111-8111-111111111102','مقهى على الرصيف','قصة قصيرة — نص تجريبي.','short','ar',
   'كان الرصيفُ ينتظرُ طلوعَ الشمس، والقهوةُ تبردُ في فنجانٍ نسي صاحبُه أن يشربها.','published',true,now()),
  ('22222222-2222-4222-8222-222222222204','11111111-1111-4111-8111-111111111102','رسالة لم تُرسل','قصة قصيرة — نص تجريبي.','short','ar',
   'كتبها مرتين، وحذفها ثلاثاً. بقي الورقُ أصدقَ منّه.','published',true,now()),
  ('22222222-2222-4222-8222-222222222205','11111111-1111-4111-8111-111111111103','أسواق قديمة','عن تاريخ الأسواق — نص تجريبي.','history','ar',
   'السوقُ ليس مكاناً للبيع فحسب، بل ذاكرةٌ جماعيةٌ تتنقّل بين الأجيال.','published',true,now()),
  ('22222222-2222-4222-8222-222222222206','11111111-1111-4111-8111-111111111104','عن الهدوء','مقال — نص تجريبي.','essays','ar',
   'الهدوءُ ليس غيابَ الصوت، بل حضورُ انتباه. نتعلّمُ أن نسمعَ ما لا يُقال.','published',true,now()),
  ('22222222-2222-4222-8222-222222222207','11111111-1111-4111-8111-111111111105','أغنية المطر','قصيدة — نص تجريبي.','poetry','ar',
   'المطرُ يطرقُ النوافذَ كأنّه ضيفٌ قديم، والنارُ في موقدِ البيتِ لم تنطفئ بعد.','published',true,now()),
  ('22222222-2222-4222-8222-222222222208','11111111-1111-4111-8111-111111111105','ليلةُ القمر','قصيدة — نص تجريبي.','poetry','ar',
   'القمرُ يملأُ الفناءَ ضوءاً، والنخلُ يقفُ حارساً صامتاً.','published',true,now()),
  ('22222222-2222-4222-8222-222222222209','11111111-1111-4111-8111-111111111106','حكايات الجدّ','عن الفلكلور — نص تجريبي.','heritage','ar',
   'الحكايةُ تُروى لتُحفظ، لا لتُصدّق. في كلّ حكايةٍ بابٌ لذاكرةٍ أكبر.','published',true,now()),
  ('22222222-2222-4222-8222-222222222210','11111111-1111-4111-8111-111111111106','طريق التمور','عن الأعراف — نص تجريبي.','heritage','ar',
   'الطريقُ الذي يمرّ ببستانِ التمرِ يعلّمكَ الصبر قبل الوصول.','published',true,now())
on conflict (id) do nothing;

-- ── sample ratings (raters are other sample authors) ────────────────
insert into public.author_ratings (author_id, rater_id, stars) values
  ('11111111-1111-4111-8111-111111111101','11111111-1111-4111-8111-111111111102',5),
  ('11111111-1111-4111-8111-111111111101','11111111-1111-4111-8111-111111111103',4),
  ('11111111-1111-4111-8111-111111111103','11111111-1111-4111-8111-111111111101',5),
  ('11111111-1111-4111-8111-111111111105','11111111-1111-4111-8111-111111111104',4),
  ('11111111-1111-4111-8111-111111111106','11111111-1111-4111-8111-111111111105',5)
on conflict (author_id, rater_id) do nothing;

-- ── recompute the rating aggregates from the source rows ────────────
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

-- ── recompute published-work rating stats (avg_rating / rating_count) ─
-- works rating comes from author_ratings in this demo; keep counts honest.
update public.works w
set rating_count = coalesce(agg.count, 0),
    avg_rating   = coalesce(agg.avg_stars, 0)
from (
  select author_id, avg_stars, count from public.author_rating_agg
) agg
where w.author_id = agg.author_id;
