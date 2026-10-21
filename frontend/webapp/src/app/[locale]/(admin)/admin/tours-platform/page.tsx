import { getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/page/page-header";
import { dashboard } from "@/features/tours/server/admin/queries";
import { adminPageActor } from "@/features/tours/server/admin/page-actor";
import { DashboardView } from "@/features/tours/ui/admin/dashboard-view";

export async function generateMetadata() {
  const t = await getTranslations("TourAdmin.dashboard");
  return { title: t("title") };
}

export default async function ToursPlatformDashboardPage() {
  const actor = await adminPageActor();
  const t = await getTranslations("TourAdmin.dashboard");
  const data = await dashboard(actor);
  return (
    <div className="space-y-5">
      <PageHeader title={t("title")} description={t("description")} />
      <DashboardView data={data} />
    </div>
  );
}
