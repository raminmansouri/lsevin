import { Metadata } from "next";

import { AdminDataDashboard } from "@/features/admin-data/components/admin-data-dashboard";
import { getAdminDashboardCounts } from "@/features/admin-data/lib/db";

export const metadata: Metadata = {
  title: "Platform data admin",
  description: "Booking, identity, and customer direct database admin panel.",
};

export default async function PlatformDataPage() {
  const cards = await getAdminDashboardCounts();
  return <AdminDataDashboard cards={cards} />;
}
