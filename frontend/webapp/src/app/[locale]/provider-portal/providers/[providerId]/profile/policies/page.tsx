import { ProfileRelatedManager } from "@/features/provider-portal/components/profile-related-manager";
import { getProviderWorkspace, listProviderProfileRelatedRecords } from "@/features/provider-portal/server/repository";
import { requireCurrentUserId } from "@/features/provider-portal/server/session";

export default async function ProviderProfileRelatedPage({ params }: { params: Promise<{ locale: string; providerId: string }> }) {
  const { locale, providerId } = await params;
  const userId = await requireCurrentUserId();

  const [workspace, related] = await Promise.all([
    getProviderWorkspace(userId, providerId, locale),
    listProviderProfileRelatedRecords(userId, providerId, locale),
  ]);

  return <ProfileRelatedManager workspace={workspace} related={related} focus="policies" />;
}
