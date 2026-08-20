import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { MarketingLoyaltyDashboard } from "@/features/marketing-loyalty/components/dashboard";
import { getMarketingLoyaltyDashboardStats } from "@/features/marketing-loyalty/db/queries";
import { getPointsEarnDivisor } from "@/features/marketing-loyalty/server/loyalty-settings.repository";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("AdminPages.marketingLoyalty");
  return {
    title: t("dashboard.title"),
    description: t("dashboard.description"),
  };
}

export default async function LoyaltyAdminPage() {
  const [stats, earnRateDivisor] = await Promise.all([
    getMarketingLoyaltyDashboardStats(),
    getPointsEarnDivisor(),
  ]);
  return <MarketingLoyaltyDashboard stats={stats} earnRateDivisor={earnRateDivisor} />;
}
