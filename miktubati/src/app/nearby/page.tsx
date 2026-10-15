import NearbyExplorer from "@/components/NearbyExplorer";
import { t } from "@/lib/i18n";
import { getCurrentLang } from "@/lib/lang";
import { IRAQ_SITES } from "@/lib/heritage/data";

export const instant = false;

export default async function NearbyPage() {
  const lang = await getCurrentLang();
  const sites = IRAQ_SITES.map((s) => ({
    id: s.id,
    name: s.name,
    governorate: s.governorate,
    lat: s.lat,
    lng: s.lng,
    cat: s.cat,
    visit: s.visit,
  }));

  return (
    <div className="stack">
      <div>
        <h1 className="page-title">{t(lang, "near_title")}</h1>
        <p className="page-sub">{t(lang, "near_sub")}</p>
      </div>
      <NearbyExplorer lang={lang} sites={sites} />
    </div>
  );
}
