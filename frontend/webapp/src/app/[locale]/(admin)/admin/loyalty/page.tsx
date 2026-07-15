import { Metadata } from "next";

import { MarketingLoyaltyDashboard } from "@/features/marketing-loyalty/components/dashboard";
import { getMarketingLoyaltyDashboardStats } from "@/features/marketing-loyalty/db/queries";
import { getPointsEarnDivisor } from "@/features/marketing-loyalty/server/loyalty-settings.repository";

export const metadata: Metadata = {
  title: "Marketing & Loyalty",
  description: "Admin dashboard for marketing offers and loyalty operations.",
};

export default async function LoyaltyAdminPage() {
  const [stats, earnRateDivisor] = await Promise.all([
    getMarketingLoyaltyDashboardStats(),
    getPointsEarnDivisor(),
  ]);
  return <MarketingLoyaltyDashboard stats={stats} earnRateDivisor={earnRateDivisor} />;
}
