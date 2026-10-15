import KidsClient from "@/components/kids/KidsClient";
import { t } from "@/lib/i18n";
import { getCurrentLang } from "@/lib/lang";

export const instant = false;

export default async function KidsPage() {
  const lang = await getCurrentLang();
  return (
    <div className="stack">
      <div>
        <h1 className="page-title">{t(lang, "kids_title")}</h1>
        <p className="page-sub">{t(lang, "kids_sub")}</p>
      </div>
      <KidsClient lang={lang} />
    </div>
  );
}
