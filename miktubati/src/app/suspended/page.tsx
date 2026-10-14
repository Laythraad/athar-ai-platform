import { getCurrentLang } from "@/lib/lang";
import Link from "next/link";

export const instant = false;

export default async function SuspendedPage() {
  const lang = await getCurrentLang();
  const ar = lang === "ar";

  return (
    <div className="panel card stack">
      <h1 className="page-title">{ar ? "الحساب معلّق" : "Account suspended"}</h1>
      <p className="muted">
        {ar
          ? "تم تعليق أو حظر حسابك. يمكنك الاعتراض؛ يراجع الاعتراض بشر."
          : "Your account is suspended or banned. You may appeal; a human reviews appeals."}
      </p>
      <p style={{ margin: 0 }}>
        <Link href="/library" className="btn btn-ghost btn-sm">
          {ar ? "العودة إلى المكتبة" : "Back to the library"}
        </Link>
      </p>
    </div>
  );
}