import Link from "next/link";
import { t, bl } from "@/lib/i18n";
import { getCurrentLang } from "@/lib/lang";
import { IRAQ_SITES } from "@/lib/heritage/data";

export const instant = false;

const CAT_COLORS: Record<string, string> = {
  archaeology: "#b06a2c",
  religious: "#7a5aa6",
  heritage: "#3f8f6a",
  nature: "#2f7fb0",
  market: "#c07a1e",
  landmark: "#b04a4a",
  museum: "#5a7ab0",
  food: "#a06a3a",
  craft: "#8a7a2c",
  science: "#2ca02c",
  space: "#4a3ab0",
};

const W = 800;
const H = 620;
const PAD = 48;

export default async function HeritageMapPage() {
  const lang = await getCurrentLang();

  const lats = IRAQ_SITES.map((s) => s.lat);
  const lngs = IRAQ_SITES.map((s) => s.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  const project = (lat: number, lng: number) => {
    const x = PAD + ((lng - minLng) / (maxLng - minLng || 1)) * (W - PAD * 2);
    const y = PAD + ((maxLat - lat) / (maxLat - minLat || 1)) * (H - PAD * 2);
    return { x, y };
  };

  const cats = Array.from(new Set(IRAQ_SITES.map((s) => s.cat)));

  return (
    <div className="stack">
      <div className="row-between">
        <div>
          <h1 className="page-title">{t(lang, "her_map_title")}</h1>
          <p className="page-sub">{t(lang, "her_map_sub")}</p>
        </div>
        <Link href="/heritage" className="btn btn-ghost btn-sm">{t(lang, "her_back")}</Link>
      </div>

      <div className="card" style={{ padding: "0.6rem" }}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          width="100%"
          role="img"
          aria-label={t(lang, "her_map_title")}
          style={{ display: "block", background: "var(--surface2)", borderRadius: 10 }}
        >
          {/* faint graticule */}
          {Array.from({ length: 6 }).map((_, i) => (
            <line
              key={`v${i}`}
              x1={PAD + (i * (W - PAD * 2)) / 5}
              x2={PAD + (i * (W - PAD * 2)) / 5}
              y1={PAD - 10}
              y2={H - PAD + 10}
              stroke="var(--line)"
              strokeWidth="1"
            />
          ))}
          {Array.from({ length: 6 }).map((_, i) => (
            <line
              key={`h${i}`}
              x1={PAD - 10}
              x2={W - PAD + 10}
              y1={PAD + (i * (H - PAD * 2)) / 5}
              y2={PAD + (i * (H - PAD * 2)) / 5}
              stroke="var(--line)"
              strokeWidth="1"
            />
          ))}

          {IRAQ_SITES.map((s) => {
            const { x, y } = project(s.lat, s.lng);
            const color = CAT_COLORS[s.cat] || "var(--accent)";
            return (
              <a key={s.id} href={`/heritage/${s.id}`} style={{ cursor: "pointer" }}>
                <title>{`${bl(lang, s.name)} — ${bl(lang, s.governorate)}`}</title>
                <circle cx={x} cy={y} r={7} fill={color} fillOpacity={0.85} stroke="#fff" strokeWidth={1.5} />
                <text
                  x={x + 11}
                  y={y + 4}
                  fontSize="12"
                  fill="var(--fg)"
                  style={{ paintOrder: "stroke", stroke: "var(--surface2)", strokeWidth: 3 }}
                >
                  {bl(lang, s.name)}
                </text>
              </a>
            );
          })}
        </svg>
      </div>

      <div className="row" style={{ flexWrap: "wrap" }}>
        {cats.map((c) => (
          <Link
            key={c}
            href={`/heritage?cat=${c}`}
            className="pill"
            style={{ display: "inline-flex", alignItems: "center", gap: 6, textDecoration: "none" }}
          >
            <span style={{ width: 10, height: 10, borderRadius: 999, background: CAT_COLORS[c], display: "inline-block" }} />
            {t(lang, `her_cat_${c}`)}
          </Link>
        ))}
      </div>

      <p className="tiny muted" style={{ margin: 0 }}>
        {t(lang, "her_map_note")}
      </p>
    </div>
  );
}
