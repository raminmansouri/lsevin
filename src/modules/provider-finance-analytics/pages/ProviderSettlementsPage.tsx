import { SettlementManager } from "../components/SettlementManager";
import { listSettlementBatches } from "../repository";
import { requireParam, type ModulePageProps } from "./_helpers";
import { getProviderTimeZone } from "@core/providers/timezone";
import { getPortalLocale } from "@core/i18n/server";

export async function ProviderSettlementsPage({ params }: ModulePageProps) {
  const providerId = requireParam(params, "providerId");
  const [settlements, timeZone, locale] = await Promise.all([listSettlementBatches(providerId, 100), getProviderTimeZone(providerId), getPortalLocale()]);
  return <SettlementManager providerId={providerId} settlements={settlements} locale={locale.header} timeZone={timeZone} />;
}
