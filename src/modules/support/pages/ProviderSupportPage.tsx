import { PageHeader } from "@core/ui/PageHeader";
import { getPortalLocale } from "@core/i18n/server";
import { getProviderTimeZone } from "@core/providers/timezone";
import type { ModulePageProps } from "@core/modules/types";
import { SupportManager } from "../components/SupportManager";
import { listProviderTickets } from "../repository";

export async function ProviderSupportPage({ params }: ModulePageProps) {
  const providerId = params.providerId;
  const [tickets, locale, timeZone] = await Promise.all([listProviderTickets(providerId), getPortalLocale(), getProviderTimeZone(providerId)]);
  return <div><PageHeader title="Provider support" description="Create and manage support tickets for this provider workspace." /><SupportManager providerId={providerId} tickets={tickets} locale={locale.header} timeZone={timeZone} /></div>;
}
