import { ServicesManager } from "@/features/provider-portal/components/services-manager";
import { getProviderWorkspace, listProviderServices, listServiceDefinitionOptions } from "@/features/provider-portal/server/repository";
import { requireCurrentUserId } from "@/features/provider-portal/server/session";

export default async function ProviderServicesPage({ params }: { params: Promise<{ locale: string; providerId: string }> }) {
  const { locale, providerId } = await params;
  const userId = await requireCurrentUserId();

  const [workspace, services, definitions] = await Promise.all([
    getProviderWorkspace(userId, providerId, locale),
    listProviderServices(userId, providerId, locale),
    listServiceDefinitionOptions(locale),
  ]);

  return <ServicesManager workspace={workspace} services={services} definitions={definitions} />;
}
