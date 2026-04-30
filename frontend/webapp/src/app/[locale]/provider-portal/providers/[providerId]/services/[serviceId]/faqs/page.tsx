import { ServiceContentManager } from "@/features/provider-portal/components/service-content-manager";
import { getProviderWorkspace, listProviderServiceRelatedRecords, listProviderServices } from "@/features/provider-portal/server/repository";
import { requireCurrentUserId } from "@/features/provider-portal/server/session";

export default async function ProviderServiceContentPage({ params }: { params: Promise<{ locale: string; providerId: string; serviceId?: string }> }) {
  const { locale, providerId, serviceId } = await params;
  const userId = await requireCurrentUserId();

  const [workspace, services, related] = await Promise.all([
    getProviderWorkspace(userId, providerId, locale),
    listProviderServices(userId, providerId, locale),
    listProviderServiceRelatedRecords(userId, providerId, locale),
  ]);

  if (!workspace.permissions.manageServices) return null;

  return <ServiceContentManager providerId={workspace.provider.id} services={services} related={related} serviceId={serviceId} focus="faqs" />;
}
