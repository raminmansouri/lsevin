import { StaffManager } from "@/features/provider-portal/components/staff-manager";
import { StaffRelatedManager } from "@/features/provider-portal/components/staff-related-manager";
import { getProviderWorkspace, listProviderStaff, listProviderStaffRelatedRecords } from "@/features/provider-portal/server/repository";
import { requireCurrentUserId } from "@/features/provider-portal/server/session";

export default async function ProviderStaffPage({ params }: { params: Promise<{ locale: string; providerId: string }> }) {
  const { locale, providerId } = await params;
  const userId = await requireCurrentUserId();

  const [workspace, staff, related] = await Promise.all([
    getProviderWorkspace(userId, providerId, locale),
    listProviderStaff(userId, providerId, locale),
    listProviderStaffRelatedRecords(userId, providerId, locale),
  ]);

  return (
    <div className="space-y-6">
      <StaffManager workspace={workspace} staff={staff} />
      {workspace.permissions.manageStaff ? <StaffRelatedManager providerId={workspace.provider.id} staff={staff} related={related} /> : null}
    </div>
  );
}
