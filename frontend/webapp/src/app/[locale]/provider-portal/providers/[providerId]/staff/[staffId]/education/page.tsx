import { StaffRelatedManager } from "@/features/provider-portal/components/staff-related-manager";
import { getProviderWorkspace, listProviderStaff, listProviderStaffRelatedRecords } from "@/features/provider-portal/server/repository";
import { requireCurrentUserId } from "@/features/provider-portal/server/session";

export default async function ProviderStaffRelatedPage({ params }: { params: Promise<{ locale: string; providerId: string; staffId?: string }> }) {
  const { locale, providerId, staffId } = await params;
  const userId = await requireCurrentUserId();

  const [workspace, staff, related] = await Promise.all([
    getProviderWorkspace(userId, providerId, locale),
    listProviderStaff(userId, providerId, locale),
    listProviderStaffRelatedRecords(userId, providerId, locale),
  ]);

  if (!workspace.permissions.manageStaff) return null;

  return <StaffRelatedManager providerId={workspace.provider.id} staff={staff} related={related} staffId={staffId} focus="education" />;
}
