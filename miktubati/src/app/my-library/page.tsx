import LibraryClient from "@/components/library/LibraryClient";
import { t } from "@/lib/i18n";
import { getCurrentLang } from "@/lib/lang";

export const instant = false;

export default async function MyLibraryPage() {
  const lang = await getCurrentLang();
  return (
    <div className="stack">
      <div>
        <h1 className="page-title">{t(lang, "lib_title")}</h1>
        <p className="page-sub">{t(lang, "lib_sub")}</p>
      </div>
      <LibraryClient lang={lang} />
    </div>
  );
}
