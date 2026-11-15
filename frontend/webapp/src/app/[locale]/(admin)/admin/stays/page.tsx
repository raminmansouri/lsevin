import { getTranslations } from "next-intl/server";

import { dashboardCounts } from "@/features/stays/server/admin/operations";
import { StaysDashboard } from "@/features/stays/ui/admin/operations-admin";
import { adminPageActor } from "@/features/tours/server/admin/page-actor";

export async function generateMetadata() {
  const t = await getTranslations("StayAdmin.dashboard");
  return { title: t("title") };
}

export default async function StaysAdminDashboardPage() {
  await adminPageActor();
  return <StaysDashboard counts={await dashboardCounts()} />;
}
