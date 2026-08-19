import { PageHeader } from "@core/ui/PageHeader";
import type { ModulePageProps } from "@core/modules/types";
import { StaffManager } from "../components/StaffManager";
import { listProviderStaff } from "../repository";
import { getPortalLocale } from "@core/i18n/server";

export async function StaffPage({ params }: ModulePageProps) {
  const providerId = params.providerId;
  const [staff, locale] = await Promise.all([listProviderStaff(providerId), getPortalLocale()]);
  return <div><PageHeader title="Staff" description="Create and link specialists, doctors, trainers or employees to this provider." /><StaffManager providerId={providerId} staff={staff} locale={locale.header} /></div>;
}
