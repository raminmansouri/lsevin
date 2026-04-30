import { ProviderProfileForm } from "@/features/provider-portal/components/profile-form";
import { ProfileRelatedManager } from "@/features/provider-portal/components/profile-related-manager";
import { getProviderWorkspace, listProviderProfileRelatedRecords } from "@/features/provider-portal/server/repository";
import { requireCurrentUserId } from "@/features/provider-portal/server/session";

export default async function ProviderProfilePage({ params }: { params: Promise<{ locale: string; providerId: string }> }) {
  const { locale, providerId } = await params;
  const userId = await requireCurrentUserId();

  const [workspace, related] = await Promise.all([
    getProviderWorkspace(userId, providerId, locale),
    listProviderProfileRelatedRecords(userId, providerId, locale),
  ]);

  return (
    <div className="space-y-6">
      <ProviderProfileForm workspace={workspace} />
      <ProfileRelatedManager workspace={workspace} related={related} />
    </div>
  );
}
