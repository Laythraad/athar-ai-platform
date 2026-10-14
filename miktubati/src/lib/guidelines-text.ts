/* Community Guidelines — versioned, real content in Arabic and English.
   These strings are what gets stored in guideline_versions and what users accept. */

export const GUIDELINES_VERSION = 1;

export const GUIDELINES_AR = `ميثاق مجتمع مكتبتي — الإصدار ١

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
مخالفة هذه القواعد قد تؤدي إلى الرفض أو التعليق أو الحظر. كل قرار يُسجَّل مع سببه.`;

export const GUIDELINES_EN = `Community Guidelines of MIKTUBATI — Version 1

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
is recorded with its reason.`;

export const GUIDELINES: Record<"ar" | "en", string> = {
  ar: GUIDELINES_AR,
  en: GUIDELINES_EN,
};

/** Structured clauses, used by the guidelines page and the tests. */
export const GUIDELINE_CLAUSES: { id: string; ar: string; en: string }[] = [
  { id: "respect", ar: "احترام المعتقد والمذهب والعرق", en: "Respect for belief, sect and ethnicity" },
  { id: "no-abuse", ar: "لا إساءة ولا تهديد", en: "No insults or threats" },
  { id: "no-explicit", ar: "لا محتوى صريح جنسيًا", en: "No sexually explicit content" },
  { id: "no-doxxing", ar: "لا ملاحقة ولا كشف بيانات", en: "No harassment or doxxing" },
  { id: "authorship", ar: "أمانة المؤلفية", en: "Honesty about authorship" },
  { id: "criticism", ar: "نقد بنّاء", en: "Constructive criticism" },
  { id: "privacy", ar: "احترام الخصوصية", en: "Respect for privacy" },
  { id: "honesty", ar: "الصدق", en: "Honesty" },
  { id: "human-review", ar: "الإشراف بشري", en: "Human review" },
  { id: "consequences", ar: "النتائج", en: "Consequences" },
];
