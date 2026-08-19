import { SettlementManager } from "../components/SettlementManager";
import { listSettlementBatches } from "../repository";
import { first, type ModulePageProps } from "./_helpers";
import { getProviderTimeZone } from "@core/providers/timezone";
import { getPortalLocale } from "@core/i18n/server";

export async function AdminSettlementsPage({ searchParams }: ModulePageProps) {
  const providerId = first(searchParams?.providerId, "");
  if (!providerId) {
    return (
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-lg font-bold">Settlement management</h2>
        <p className="mt-2 text-sm text-muted-foreground">Pass a providerId query string to review and create settlement batches.</p>
      </div>
    );
  }
  const [settlements, timeZone, locale] = await Promise.all([listSettlementBatches(providerId, 200), getProviderTimeZone(providerId), getPortalLocale()]);
  return <SettlementManager providerId={providerId} settlements={settlements} adminMode locale={locale.header} timeZone={timeZone} />;
}
