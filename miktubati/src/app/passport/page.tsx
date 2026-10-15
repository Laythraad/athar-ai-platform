import PassportClient from "@/components/passport/PassportClient";
import { t } from "@/lib/i18n";
import { getCurrentLang } from "@/lib/lang";
import { getSession } from "@/lib/session";

export const instant = false;

export default async function PassportPage() {
  const lang = await getCurrentLang();
  const s = await getSession();
  return (
    <div className="stack">
      <div>
        <h1 className="page-title">{t(lang, "passport_title")}</h1>
        <p className="page-sub">{t(lang, "passport_sub")}</p>
      </div>
      <PassportClient lang={lang} signedIn={Boolean(s.userId)} />
    </div>
  );
}
