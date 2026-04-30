import { notFound } from "next/navigation";

import { ProviderRecordForm } from "@/features/provider-portal/components/provider-record-form";
import { getProviderWorkspace, listProviderServiceRelatedRecords, listProviderServices } from "@/features/provider-portal/server/repository";
import { requireCurrentUserId } from "@/features/provider-portal/server/session";
import { providerPortalBack, providerServiceOptions } from "@/features/provider-portal/lib/form-page-utils";

export default async function EditServiceIncludedPage({ params }: { params: Promise<{ locale: string; providerId: string; serviceId: string; includedId: string }> }) {
  const { locale, providerId, serviceId, includedId } = await params;
  const userId = await requireCurrentUserId();
  await getProviderWorkspace(userId, providerId, locale);
  const [services, related] = await Promise.all([
    listProviderServices(userId, providerId, locale),
    listProviderServiceRelatedRecords(userId, providerId, locale),
  ]);
  const item = related.included.find((row) => row.id === includedId && row.providerServiceId === serviceId);
  if (!item) notFound();

  const fields = [
    { name: "providerId", type: "hidden" as const },
    { name: "includedId", type: "hidden" as const },
    { name: "providerServiceId", label: "Service", type: "select" as const, required: true, options: providerServiceOptions(services), fullWidth: true },
    { name: "item", label: "Included item", type: "text" as const, required: true, fullWidth: true },
  ];

  return <ProviderRecordForm operation="saveServiceIncluded" title="Edit included item" description="Update this included item." fields={fields} initialValues={{ providerId, includedId: item.id, providerServiceId: item.providerServiceId, item: item.item }} backHref={providerPortalBack(providerId, `/services/${serviceId}/included`)} submitLabel="Save item" successMessage="Included item updated." />;
}
