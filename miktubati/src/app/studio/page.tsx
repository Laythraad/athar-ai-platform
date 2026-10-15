import StudioClient from "@/components/studio/StudioClient";
import { t } from "@/lib/i18n";
import { getCurrentLang } from "@/lib/lang";

export const instant = false;

export default async function StudioPage() {
  const lang = await getCurrentLang();
  return (
    <div className="stack">
      <div>
        <h1 className="page-title">{t(lang, "studio_title")}</h1>
        <p className="page-sub">{t(lang, "studio_sub")}</p>
      </div>
      <StudioClient lang={lang} />
    </div>
  );
}
