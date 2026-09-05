import { getSettingsOverview } from "./queries";
import SettingsPageClient from "./SettingsPageClient";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const data = await getSettingsOverview();
  return <SettingsPageClient initialData={data} />;
}
