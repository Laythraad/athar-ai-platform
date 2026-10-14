import { getCurrentLang } from "@/lib/lang";
import VerifyView from "./verify-view";

export const instant = false;

export default async function VerifyPage() {
  const lang = await getCurrentLang();
  return <VerifyView initialLang={lang} />;
}
