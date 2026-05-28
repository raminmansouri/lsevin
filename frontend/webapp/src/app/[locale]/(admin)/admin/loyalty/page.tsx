import { Metadata } from "next";

import { MarketingLoyaltyDashboard } from "@/features/marketing-loyalty/components/dashboard";
import { getMarketingLoyaltyDashboardStats } from "@/features/marketing-loyalty/db/queries";

export const metadata: Metadata = {
  title: "Marketing & Loyalty",
  description: "Admin dashboard for marketing offers and loyalty operations.",
};

export default async function LoyaltyAdminPage() {
  const stats = await getMarketingLoyaltyDashboardStats();
  return <MarketingLoyaltyDashboard stats={stats} />;
}
