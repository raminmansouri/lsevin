import { PageHeader } from "@core/ui/PageHeader";
import { getPortalLocale } from "@core/i18n/server";
import type { ModulePageProps } from "@core/modules/types";
import { ManagementHub } from "../components/ManagementHub";
import { getProviderManagementSnapshot } from "../repository";

export async function ProviderManagePage({ params }: ModulePageProps) {
  const providerId = params.providerId;
  const [snapshot, locale] = await Promise.all([getProviderManagementSnapshot(providerId), getPortalLocale()]);
  return <div><PageHeader title="Manage provider" description="One control surface for every provider data-entry and operations module." /><ManagementHub providerId={providerId} snapshot={snapshot} locale={locale.header} /></div>;
}
