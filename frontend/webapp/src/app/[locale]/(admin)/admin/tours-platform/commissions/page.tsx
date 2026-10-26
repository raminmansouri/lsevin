import { getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/page/page-header";
import { listAgreements } from "@/features/tours/server/admin/commissions";
import { adminPageActor } from "@/features/tours/server/admin/page-actor";
import { filterLookups } from "@/features/tours/server/admin/queries";
import { getTourSettings } from "@/features/tours/server/platform/settings";
import { CommissionsPanel } from "@/features/tours/ui/admin/ops-panels";

export async function generateMetadata() {
  const t = await getTranslations("TourAdmin.commissions");
  return { title: t("title") };
}

export default async function CommissionsPage() {
  const actor = await adminPageActor();
  const t = await getTranslations("TourAdmin.commissions");
  const [agreements, lookups, settings] = await Promise.all([listAgreements(actor), filterLookups(actor), getTourSettings()]);
  return (
    <div className="space-y-5">
      <PageHeader title={t("title")} description={t("description")} />
      <CommissionsPanel agreements={agreements} providers={lookups.providers} platformDefault={settings.platformCommissionPercent} />
    </div>
  );
}
