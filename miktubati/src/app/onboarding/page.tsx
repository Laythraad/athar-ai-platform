import { getCurrentLang } from "@/lib/lang";
import { getLatestGuidelineVersion } from "@/lib/session";
import OnboardingView from "./onboarding-view";

export const instant = false;

export default async function OnboardingPage() {
  const lang = await getCurrentLang();
  const latestVersion = await getLatestGuidelineVersion();
  return <OnboardingView initialLang={lang} latestVersion={latestVersion} />;
}
