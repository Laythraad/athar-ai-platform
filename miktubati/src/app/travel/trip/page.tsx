import { getCurrentLang } from "@/lib/lang";
import { t } from "@/lib/i18n";
import TripClient from "@/components/TripClient";

export const instant = false;

export default async function TripPage() {
  const lang = await getCurrentLang();
  return (
    <div className="stack">
      <div>
        <h1 className="page-title">{t(lang, "trip_title")}</h1>
        <p className="page-sub">{t(lang, "trip_sub")}</p>
      </div>
      <TripClient lang={lang} />
    </div>
  );
}
