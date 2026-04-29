import { MediaManager } from "@/features/provider-portal/components/media-manager";
import { getProviderWorkspace, listProviderGallery } from "@/features/provider-portal/server/repository";
import { requireCurrentUserId } from "@/features/provider-portal/server/session";

export default async function ProviderMediaPage({ params }: { params: Promise<{ locale: string; providerId: string }> }) {
  const { locale, providerId } = await params;
  const userId = await requireCurrentUserId();

  const [workspace, gallery] = await Promise.all([
    getProviderWorkspace(userId, providerId, locale),
    listProviderGallery(userId, providerId, locale),
  ]);

  return <MediaManager workspace={workspace} gallery={gallery} />;
}
