import { getCurrentLang } from "@/lib/lang";
import PublishView from "./publish-view";

export const instant = false;

export default async function PublishPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const lang = await getCurrentLang();
  const { edit } = await searchParams;
  return <PublishView initialLang={lang} editId={edit && edit.length > 0 ? edit : null} />;
}
