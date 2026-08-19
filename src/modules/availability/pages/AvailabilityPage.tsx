import { getPortalLocale } from "@core/i18n/server";
import { PageHeader } from "@core/ui/PageHeader";
import type { ModulePageProps } from "@core/modules/types";
import { getProviderTimeZone } from "@core/providers/timezone";
import { AvailabilityManager } from "../components/AvailabilityManager";
import { listAvailabilityRules, listBookableResources, listOperatingHours } from "../repository";
import { translatePortalText } from "@core/i18n/translate";

export async function AvailabilityPage({ params }: ModulePageProps) {
  const providerId = params.providerId;
  const [locale, timeZone, hours, resources, rules] = await Promise.all([getPortalLocale(), getProviderTimeZone(providerId), listOperatingHours(providerId), listBookableResources(providerId), listAvailabilityRules(providerId)]);
  const copy = (source: string) => translatePortalText(locale.locale, source);
  return <div><PageHeader title={copy("Availability")} description={copy("Provider operating hours, bookable resources and advanced booking slot settings.")} /><AvailabilityManager providerId={providerId} hours={hours} resources={resources} rules={rules} locale={locale.header} timeZone={timeZone} /></div>;
}
