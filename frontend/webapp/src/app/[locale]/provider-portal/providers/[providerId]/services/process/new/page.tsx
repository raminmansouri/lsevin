import { ProviderRecordForm } from "@/features/provider-portal/components/provider-record-form";
import { getProviderWorkspace, listProviderServiceRelatedRecords, listProviderServices } from "@/features/provider-portal/server/repository";
import { requireCurrentUserId } from "@/features/provider-portal/server/session";
import { providerPortalBack, providerServiceOptions } from "@/features/provider-portal/lib/form-page-utils";

export default async function NewServiceProcessFromServicesPage({ params }: { params: Promise<{ locale: string; providerId: string }> }) {
  const { locale, providerId } = await params;
  const userId = await requireCurrentUserId();
  await getProviderWorkspace(userId, providerId, locale);
  const [services, related] = await Promise.all([
    listProviderServices(userId, providerId, locale),
    listProviderServiceRelatedRecords(userId, providerId, locale),
  ]);
  const defaultServiceId = services[0]?.id || "";
  const nextStep = defaultServiceId ? related.process.filter((item) => item.providerServiceId === defaultServiceId).length + 1 : 1;

  const fields = [
    { name: "providerId", type: "hidden" as const },
    { name: "processId", type: "hidden" as const },
    { name: "providerServiceId", label: "Service", type: "select" as const, required: true, options: providerServiceOptions(services), fullWidth: true },
    { name: "step", label: "Step number", type: "number" as const, min: 1, required: true },
    { name: "title", label: "Step title", type: "text" as const },
    { name: "duration", label: "Duration label", type: "text" as const },
    { name: "description", label: "Description", type: "textarea" as const, rows: 5, fullWidth: true },
  ];

  return <ProviderRecordForm operation="saveServiceProcess" title="Add process step" description="Choose a service and create a customer-facing process step." fields={fields} initialValues={{ providerId, providerServiceId: defaultServiceId, step: nextStep }} backHref={providerPortalBack(providerId, "/services/process")} submitLabel="Save step" successMessage="Process step saved." />;
}
