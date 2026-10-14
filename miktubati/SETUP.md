# إعداد مكتبتي — تشغيل المجتمع فعلياً

هذا الدليل يوصلك من "كود بدون قاعدة بيانات" إلى "مجتمع شغّال" في خطوات واضحة.
تحتاج فقط **حسابَين مجانيين**: Supabase و Google.

> كل بياناتك الأمنية (المفاتيح) توضع في `.env.local` — هذا الملف **غير مُتتبَّع**
> في Git ولا يُرفع أبداً. `.env.example` فيه الأسماء فقط بدون قيم.

---

## الخطوة 0 — المتطلبات
- Node.js 18+ (عندك v24 ✅)
- حساب Supabase مجاني — https://supabase.com
- حساب Google Cloud (لتسجيل الدخول بجوجل) — https://console.cloud.google.com

---

## الخطوة 1 — أنشئ مشروع Supabase
1. ادخل https://supabase.com → **New project**.
2. اختر اسم المشروع + كلمة مرور لقاعدة البيانات + المنطقة (الأقرب لك).
3. انتظر حتى يكتمل الإنشاء (دقيقة أو دقيقتين).

## الخطوة 2 — طبّق قواعد البيانات
في لوحة Supabase: **SQL Editor** ← **New query**.

انسخ محتوى كل ملف بالترتيب واضغط **Run** بعد كل واحد:
1. `supabase/migrations/0001_init.sql` — الجداول والصلاحيات (RLS)
2. `supabase/migrations/0002_identity_privacy.sql` — الاسم الكامل الخاص + اسم المستخدم
3. `supabase/seed-demo.sql` — **اختياري**: بيانات تجريبية (مؤلفون وأعمال شعر وقصص وتقييمات) عشان المكتبة ما تكون فارغة. كلها معلّمة "بيانات تجريبية" في الواجهة.

> إذا ظهر خطأ عند الترحيل، صدّرني النص الخطأ وأصلحه.

## الخطوة 3 — فعّل تسجيل الدخول بجوجل
### أ) من Google Cloud (الحصول على المفاتيح):
1. ادخل https://console.cloud.google.com → أنشئ مشروع جديد (أو اختر موجود).
2. **APIs & Services → Library** → فعّل **Google+ API** (أو "Google Identity").
3. **APIs & Services → OAuth consent screen** → اختر **External** → املأ اسم التطبيق → أضف نطاقك.
4. **APIs & Services → Credentials → Create credentials → OAuth client ID**:
   - Application type: **Web application**
   - Authorized redirect URIs: أضف هذا السطر (بدّل `localhost` بنطاقك لاحقاً):
     ```
     http://localhost:3000/auth/callback
     ```
5. احفظ **Client ID** و **Client Secret**.

### ب) من Supabase (ربطه):
1. **Authentication → Providers → Google** → **Enable**.
2. الصق **Client ID** و **Client Secret** من Google.
3. **Authentication → URL Configuration** → أضف `http://localhost:3000` في **Redirect URLs**.

## الخطوة 4 — أنشئ ملف `.env.local`
أنشئ ملف `.env.local` في جذر `miktubati/` وضع فيه:

```
NEXT_PUBLIC_SUPABASE_URL=https://<PROJECT-REF>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
SUPABASE_SERVICE_ROLE_KEY=<service role key>   # سري جداً — لا تشاركه
ADMIN_EMAIL=<بريدك الذي ستصبح مدير>
GEMINI_API_KEY=                                 # اختياري — بدونه الإشراف يدوياً
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

تلقى المفاتيح من: **Supabase → Project Settings → API**.

> ⚠️ `SUPABASE_SERVICE_ROLE_KEY` يتجاوز كل الصلاحيات. لا ترفعه في Git ولا تشاركه.

## الخطوة 5 — شغّل التطبيق
```bash
cd miktubati
npm install
npm run dev
```
افتح http://localhost:3000

---

## أول استخدام (بعد التشغيل)
1. اضغط **تسجيل الدخول بجوجل**.
2. سجّل بحسابك — بريدك في جوجل **مُتحقَّق منه تلقائياً**.
3. تظهر لك شاشة الترحيب: **شنو هو مكتبتي + لماذا يهم العراق والسياحة والثقافة**.
4. ثم **الميزات**، ثم **القواعد** (توافق عليها)، ثم **هويتك**: اسمك الثلاثي (خاص) + اسم المستخدم (عام).
5. تدخل المكتبة. حسابك في `ADMIN_EMAIL` يصبح **مدير تلقائياً** بعد التحقق.

## لوحة المدير
افتح `/admin` بحساب المدير: مراجعة الأعمال، إغلاق البلاغات، إدارة المستخدمين
(ترقية مشرف / تعليق / حظر)، نشر إصدارات جديدة من الميثاق، وسجل التدقيق.

## الأمان — ماذا حصل
- **Google OAuth**: لا كلمة مرور تُخزَّن عندك أبداً.
- **الاسم الثلاثي** يُحفظ في جدول خاص `profile_private` — لا يظهر للعامة، ولا يقرأه إلا صاحبه والمشرف عبر الخدمة.
- **RLS** يمنع أي قراءة أو كتابة خارج السياسات، حتى من المتصفح.
- **الإشراف** ثلاثي الطبقات ويفشل بأمان (ما ينشر تلقائياً عند خطأ).
- **سجل تدقيق** لكل إجراء مشرف.

## حذف البيانات التجريبية
```sql
delete from public.works where is_sample;
delete from public.profiles where is_sample;
```
(المستخدمون التجريبيون في `auth.users` يبقون لكنهم معزولون.)

## استكشاف الأخطاء
| المشكلة | الحل |
|---|---|
| "قاعدة البيانات غير متصلة" | تأكد `.env.local` موجود وصحيح ثم أعد تشغيل `npm run dev` |
| زر جوجل لا يعمل | تأكد المزوّد مفعّل + رابط التحويل مضبوط في Supabase و Google |
| "اسم المستخدم محجوز" | جرّب اسماً آخر |
| خطأ في الترحيل | أرسل لي نص الخطأ |
