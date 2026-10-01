import { getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/page/page-header";
import { BookingsManager } from "@/features/provider-portal/components/bookings-manager";
import { getProviderWorkspace, listProviderBookings } from "@/features/provider-portal/server/repository";
import { requireCurrentUserId } from "@/features/provider-portal/server/session";

export default async function ProviderCasesPage({ params }: {
  params: Promise<{ locale: string; providerId: string }>;
}) {
  const { locale, providerId } = await params;
  const userId = await requireCurrentUserId();
  const [workspace, bookings, t] = await Promise.all([
    getProviderWorkspace(userId, providerId, locale),
    listProviderBookings(userId, providerId, locale),
    getTranslations({ locale, namespace: "CaseManagement" }),
  ]);
  const cases = bookings.filter((booking) => booking.caseTimeline !== null);
  const title = workspace.role === "staff" ? t("myCases") : t("providerCases");

  return <div className="space-y-6">
    <PageHeader title={title} description={t("description")} />
    <BookingsManager workspace={workspace} bookings={cases} />
  </div>;
}
