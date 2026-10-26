import { getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/page/page-header";
import { adminPageActor } from "@/features/tours/server/admin/page-actor";
import { getTourSettings } from "@/features/tours/server/platform/settings";
import { SettingsForm } from "@/features/tours/ui/admin/settings-form";

export async function generateMetadata() {
  const t = await getTranslations("TourAdmin.settings");
  return { title: t("title") };
}

export default async function SettingsPage() {
  await adminPageActor();
  const t = await getTranslations("TourAdmin.settings");
  const settings = await getTourSettings({ fresh: true });
  return (
    <div className="space-y-5">
      <PageHeader title={t("title")} description={t("description")} />
      <SettingsForm settings={settings} />
    </div>
  );
}
