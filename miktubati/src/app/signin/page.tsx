import { getCurrentLang } from "@/lib/lang";
import SigninView from "./signin-view";

export const instant = false;

export default async function SigninPage() {
  const lang = await getCurrentLang();
  return <SigninView initialLang={lang} />;
}
