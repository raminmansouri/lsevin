import { StaffManager } from "@/features/provider-portal/components/staff-manager";
import { getProviderWorkspace, listProviderStaff } from "@/features/provider-portal/server/repository";
import { requireCurrentUserId } from "@/features/provider-portal/server/session";

export default async function ProviderStaffPage({ params }: { params: Promise<{ locale: string; providerId: string }> }) {
  const { locale, providerId } = await params;
  const userId = await requireCurrentUserId();

  const [workspace, staff] = await Promise.all([
    getProviderWorkspace(userId, providerId, locale),
    listProviderStaff(userId, providerId, locale),
  ]);

  return <StaffManager workspace={workspace} staff={staff} />;
}
