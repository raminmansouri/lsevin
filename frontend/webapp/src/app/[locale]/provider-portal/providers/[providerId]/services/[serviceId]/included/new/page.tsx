import { notFound } from "next/navigation";

import { ProviderRecordForm } from "@/features/provider-portal/components/provider-record-form";
import { getProviderWorkspace, listProviderServiceRelatedRecords, listProviderServices } from "@/features/provider-portal/server/repository";
import { requireCurrentUserId } from "@/features/provider-portal/server/session";
import { providerPortalBack, providerServiceOptions } from "@/features/provider-portal/lib/form-page-utils";

export default async function NewServiceIncludedPage({ params }: { params: Promise<{ locale: string; providerId: string; serviceId: string }> }) {
  const { locale, providerId, serviceId } = await params;
  const userId = await requireCurrentUserId();
  await getProviderWorkspace(userId, providerId, locale);
  const services = await listProviderServices(userId, providerId, locale);
  if (!services.some((item) => item.id === serviceId)) notFound();

  const fields = [
    { name: "providerId", type: "hidden" as const },
    { name: "includedId", type: "hidden" as const },
    { name: "providerServiceId", label: "Service", type: "select" as const, required: true, options: providerServiceOptions(services), fullWidth: true },
    { name: "item", label: "Included item", type: "text" as const, required: true, fullWidth: true },
  ];

  return <ProviderRecordForm operation="saveServiceIncluded" title="Add included item" description="Add what is included in this provider service." fields={fields} initialValues={{ providerId, providerServiceId: serviceId }} backHref={providerPortalBack(providerId, `/services/${serviceId}/included`)} submitLabel="Save item" successMessage="Included item saved." />;
}
