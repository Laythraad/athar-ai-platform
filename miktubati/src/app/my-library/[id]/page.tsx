import ReaderClient from "@/components/library/ReaderClient";
import { getCurrentLang } from "@/lib/lang";

export const instant = false;

export default async function LibraryItemPage() {
  const lang = await getCurrentLang();
  return <ReaderClient lang={lang} />;
}
