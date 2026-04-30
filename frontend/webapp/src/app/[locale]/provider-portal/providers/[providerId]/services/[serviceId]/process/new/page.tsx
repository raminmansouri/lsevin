import { notFound } from "next/navigation";

import { ProviderRecordForm } from "@/features/provider-portal/components/provider-record-form";
import { getProviderWorkspace, listProviderServiceRelatedRecords, listProviderServices } from "@/features/provider-portal/server/repository";
import { requireCurrentUserId } from "@/features/provider-portal/server/session";
import { providerPortalBack, providerServiceOptions } from "@/features/provider-portal/lib/form-page-utils";

export default async function NewServiceProcessPage({ params }: { params: Promise<{ locale: string; providerId: string; serviceId: string }> }) {
  const { locale, providerId, serviceId } = await params;
  const userId = await requireCurrentUserId();
  await getProviderWorkspace(userId, providerId, locale);
  const [services, related] = await Promise.all([
    listProviderServices(userId, providerId, locale),
    listProviderServiceRelatedRecords(userId, providerId, locale),
  ]);
  if (!services.some((item) => item.id === serviceId)) notFound();
  const nextStep = related.process.filter((item) => item.providerServiceId === serviceId).length + 1;

  const fields = [
    { name: "providerId", type: "hidden" as const },
    { name: "processId", type: "hidden" as const },
    { name: "providerServiceId", label: "Service", type: "select" as const, required: true, options: providerServiceOptions(services), fullWidth: true },
    { name: "step", label: "Step number", type: "number" as const, min: 1, required: true },
    { name: "title", label: "Step title", type: "text" as const },
    { name: "duration", label: "Duration label", type: "text" as const },
    { name: "description", label: "Description", type: "textarea" as const, rows: 5, fullWidth: true },
  ];

  return <ProviderRecordForm operation="saveServiceProcess" title="Add process step" description="Add a step to the customer-facing service process." fields={fields} initialValues={{ providerId, providerServiceId: serviceId, step: nextStep }} backHref={providerPortalBack(providerId, `/services/${serviceId}/process`)} submitLabel="Save step" successMessage="Process step saved." />;
}
