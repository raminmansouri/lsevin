import { getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/page/page-header";
import { adminPageActor } from "@/features/tours/server/admin/page-actor";
import { complianceQueue, filterLookups } from "@/features/tours/server/admin/queries";
import { CompliancePanel } from "@/features/tours/ui/admin/ops-panels";

export async function generateMetadata() {
  const t = await getTranslations("TourAdmin.compliance");
  return { title: t("title") };
}

export default async function CompliancePage() {
  const actor = await adminPageActor();
  const t = await getTranslations("TourAdmin.compliance");
  const [data, lookups] = await Promise.all([complianceQueue(actor), filterLookups(actor)]);
  return (
    <div className="space-y-5">
      <PageHeader title={t("title")} description={t("description")} />
      <CompliancePanel data={data} providers={lookups.providers} />
    </div>
  );
}
