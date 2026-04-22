import { getReferralAdminDashboardDataAction } from "./actions";
import { ReferralAdminDashboardClient } from "./ReferralAdminDashboardClient";

export default async function ReferralAdminPage() {
  const data = await getReferralAdminDashboardDataAction();

  return <ReferralAdminDashboardClient initialData={data} />;
}
