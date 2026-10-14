import { getCurrentLang } from "@/lib/lang";
import SignupView from "./signup-view";

export const instant = false;

export default async function SignupPage() {
  const lang = await getCurrentLang();
  return <SignupView initialLang={lang} />;
}
