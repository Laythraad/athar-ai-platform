import type { Metadata } from "next";
import { Amiri, IBM_Plex_Sans_Arabic } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BottomNav from "@/components/BottomNav";
import { isRtl } from "@/lib/i18n";
import { getCurrentLang } from "@/lib/lang";

/* Clear, heritage-led typography: Amiri (Naskh serif) for display headings,
   IBM Plex Sans Arabic for body/UI — both self-hosted by next/font. */
const displayFont = Amiri({
  weight: ["400", "700"],
  subsets: ["arabic", "latin"],
  variable: "--font-display-web",
  display: "swap",
  fallback: ["Georgia", "Times New Roman", "serif"],
});

const bodyFont = IBM_Plex_Sans_Arabic({
  weight: ["400", "500", "600", "700"],
  subsets: ["arabic", "latin"],
  variable: "--font-ui-web",
  display: "swap",
  fallback: ["Segoe UI", "Tahoma", "system-ui", "sans-serif"],
});

export const metadata: Metadata = {
  title: "أثَر — ATHAR | MIKTUBATI IRAQ",
  description:
    "اقرأ. اكتب. اترك أثرك. مكتبة مجتمعية للكتابة العراقية والعربية — Read, write, leave your trace. Part of MIKTUBATI IRAQ.",
};

/* This app is request-time by nature: the layout reads a language cookie and
   every page reads the session. `instant = false` tells Cache Components to
   render at request time instead of trying to prerender at build. */
export const instant = false;

/* Applies the persisted theme + customization prefs before first paint so
   there is no flash of the wrong colors. Reads localStorage.mkt_theme (legacy)
   and localStorage.mkt_prefs (accent, size, density, radius, font). */
const themeScript = `(function(){try{
var p=null;try{p=JSON.parse(localStorage.getItem("mkt_prefs")||"null")}catch(e){}
var m=(p&&p.theme)||localStorage.getItem("mkt_theme");
if(m==="dark"||m==="light"){document.documentElement.setAttribute("data-theme",m);}
var el=document.documentElement;
function set(k,v){if(v)el.style.setProperty(k,v)}
function mix(a){return (a&&a.toLowerCase()==="#0f766e")?"#b4551d":"#0f766e"}
if(p){
  set("--accent",p.accent);set("--accent-strong",p.accent);set("--accent-2",mix(p.accent));
  set("--font-scale",p.fontSize==="sm"?"0.94":p.fontSize==="lg"?"1.1":"1");
  set("--pad-scale",p.density==="compact"?"0.8":p.density==="roomy"?"1.25":"1");
  set("--radius",p.radius==="soft"?"6px":p.radius==="round"?"18px":"12px");
  set("--font-body",p.font==="naskh"?'var(--font-display-web),"Amiri","Traditional Arabic","Noto Naskh Arabic",serif':'var(--font-ui-web),"Segoe UI","Noto Sans Arabic","Tahoma",system-ui,sans-serif');
}}catch(e){}})();`;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = await getCurrentLang();
  const dir = isRtl(lang) ? "rtl" : "ltr";

  return (
    // `suppressHydrationWarning`: the theme script above rewrites `data-theme`
    // on <html> before React hydrates, so the server attribute can differ by
    // design (localStorage). React would otherwise flag it as a mismatch.
    <html
      lang={lang}
      dir={dir}
      className={`h-full antialiased ${displayFont.variable} ${bodyFont.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full flex flex-col">
        <Header lang={lang} />
        <main className="shell flex-1">{children}</main>
        <Footer lang={lang} />
        <BottomNav lang={lang} />
      </body>
    </html>
  );
}
