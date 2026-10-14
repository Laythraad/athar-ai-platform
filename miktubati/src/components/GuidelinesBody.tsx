import { GUIDELINES, GUIDELINE_CLAUSES } from "@/lib/guidelines-text";
import { t, type Lang } from "@/lib/i18n";

/**
 * Renders the community guidelines.
 *
 * Body text is rendered as PLAIN TEXT (never `dangerouslySetInnerHTML`) so a
 * stored guideline body can never inject markup. The code constants are the
 * trusted source; a DB body simply overrides the wording.
 */
export default function GuidelinesBody({ lang, html }: { lang: Lang; html?: string | null }) {
  // GUIDELINES is authored in ar/en only; other UI languages fall back to English.
  const body = html && html.trim() ? html : GUIDELINES[lang === "ar" ? "ar" : "en"];

  return (
    <div className="prose">
      <h2>{t(lang, "guidelines_body_title")}</h2>
      <ul>
        {GUIDELINE_CLAUSES.map((c, i) => (
          <li key={c.id}>
            <strong>
              {lang === "ar" ? arabicOrdinal(i + 1) : `${i + 1}.`} {lang === "ar" ? c.ar : c.en}
            </strong>
          </li>
        ))}
      </ul>

      <pre className="pre" style={{ fontFamily: "inherit", marginTop: "1rem" }}>
        {body}
      </pre>
    </div>
  );
}

function arabicOrdinal(n: number): string {
  const map = ["١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩", "١٠"];
  return `${map[n - 1] ?? n}.`;
}
