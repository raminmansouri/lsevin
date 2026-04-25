import { getSettingsOverview } from "./queries";
import SettingsPageClient from "./SettingsPageClient";

export default async function SettingsPage() {
  const data = await getSettingsOverview();
  return <SettingsPageClient initialData={data} />;
}
