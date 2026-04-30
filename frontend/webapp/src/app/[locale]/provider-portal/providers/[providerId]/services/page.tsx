import { ServicesManager } from "@/features/provider-portal/components/services-manager";
import { ServiceContentManager } from "@/features/provider-portal/components/service-content-manager";
import { ServicesRelatedManager } from "@/features/provider-portal/components/services-related-manager";
import { getProviderWorkspace, listProviderServiceRelatedRecords, listProviderServices, listServiceDefinitionOptions } from "@/features/provider-portal/server/repository";
import { requireCurrentUserId } from "@/features/provider-portal/server/session";

export default async function ProviderServicesPage({ params }: { params: Promise<{ locale: string; providerId: string }> }) {
  const { locale, providerId } = await params;
  const userId = await requireCurrentUserId();

  const [workspace, services, definitions, related] = await Promise.all([
    getProviderWorkspace(userId, providerId, locale),
    listProviderServices(userId, providerId, locale),
    listServiceDefinitionOptions(locale),
    listProviderServiceRelatedRecords(userId, providerId, locale),
  ]);

  return (
    <div className="space-y-6">
      <ServicesManager workspace={workspace} services={services} definitions={definitions} />
      {workspace.permissions.manageServices ? (
        <>
          <ServicesRelatedManager providerId={workspace.provider.id} services={services} related={related} />
          <ServiceContentManager providerId={workspace.provider.id} services={services} related={related} />
        </>
      ) : null}
    </div>
  );
}
