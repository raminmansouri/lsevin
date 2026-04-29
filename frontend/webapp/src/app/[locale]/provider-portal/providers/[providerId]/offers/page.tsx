import { OffersManager } from "@/features/provider-portal/components/offers-manager";
import { getProviderWorkspace, listProviderOffers, listProviderServices } from "@/features/provider-portal/server/repository";
import { requireCurrentUserId } from "@/features/provider-portal/server/session";

export default async function ProviderOffersPage({ params }: { params: Promise<{ locale: string; providerId: string }> }) {
  const { locale, providerId } = await params;
  const userId = await requireCurrentUserId();

  const [workspace, offers, services] = await Promise.all([
    getProviderWorkspace(userId, providerId, locale),
    listProviderOffers(userId, providerId, locale),
    listProviderServices(userId, providerId, locale),
  ]);

  return <OffersManager workspace={workspace} offers={offers} services={services} />;
}
