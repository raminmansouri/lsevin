import { getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/page/page-header";
import { adminPageActor } from "@/features/tours/server/admin/page-actor";
import { listAllDestinations } from "@/features/tours/server/admin/queries";
import { getTourSettings } from "@/features/tours/server/platform/settings";
import { DestinationsManager } from "@/features/tours/ui/admin/destinations-manager";

export async function generateMetadata() {
  const t = await getTranslations("TourAdmin.destinations");
  return { title: t("title") };
}

export default async function DestinationsPage() {
  const actor = await adminPageActor();
  const t = await getTranslations("TourAdmin.destinations");
  const [rows, settings] = await Promise.all([listAllDestinations(actor), getTourSettings()]);
  return (
    <div className="space-y-5">
      <PageHeader title={t("title")} description={t("description")} />
      <DestinationsManager rows={rows} locales={settings.enabledLocales} />
    </div>
  );
}
