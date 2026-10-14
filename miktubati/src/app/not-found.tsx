import Link from "next/link";
import { t } from "@/lib/i18n";
import { getCurrentLang } from "@/lib/lang";

export const instant = false;

export default async function NotFound() {
  const lang = await getCurrentLang();
  return (
    <div className="panel card stack" style={{ textAlign: "center" }}>
      <h1 className="page-title">404</h1>
      <p className="muted" style={{ margin: 0 }}>
        {t(lang, "common_something_wrong")}
      </p>
      <div className="row" style={{ justifyContent: "center" }}>
        <Link href="/" className="btn btn-primary btn-sm">
          {t(lang, "common_go_home")}
        </Link>
        <Link href="/library" className="btn btn-ghost btn-sm">
          {t(lang, "common_go_library")}
        </Link>
      </div>
    </div>
  );
}
