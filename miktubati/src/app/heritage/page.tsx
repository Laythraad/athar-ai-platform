import { getCurrentLang } from "@/lib/lang";
import HeritageExplorer from "@/components/HeritageExplorer";

export const instant = false;

type SP = { q?: string; cat?: string; gov?: string };

export default async function HeritagePage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const lang = await getCurrentLang();
  const sp = await searchParams;
  return <HeritageExplorer lang={lang} sp={sp} />;
}
