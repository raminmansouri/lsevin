import { PageHeader } from "@core/ui/PageHeader";
import { getPortalLocale } from "@core/i18n/server";
import { getProviderTimeZone } from "@core/providers/timezone";
import type { ModulePageProps } from "@core/modules/types";
import { OffersManager } from "../components/OffersManager";
import { listOfferServiceOptions, listProviderOffers } from "../repository";

export async function OffersPage({ params }: ModulePageProps) {
  const providerId = params.providerId;
  const [offers, services, locale, timeZone] = await Promise.all([listProviderOffers(providerId), listOfferServiceOptions(providerId), getPortalLocale(), getProviderTimeZone(providerId)]);
  return <div><PageHeader title="Offers" description="Create and manage promotional offers for provider services." /><OffersManager providerId={providerId} offers={offers} services={services} locale={locale.header} timeZone={timeZone} /></div>;
}
