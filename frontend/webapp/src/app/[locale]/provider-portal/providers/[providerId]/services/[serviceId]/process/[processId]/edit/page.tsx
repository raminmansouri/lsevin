import { notFound } from "next/navigation";

import { ProviderRecordForm } from "@/features/provider-portal/components/provider-record-form";
import {
  getProviderWorkspace,
  listProviderServiceRelatedRecords,
  listProviderServices,
} from "@/features/provider-portal/server/repository";
import { requireCurrentUserId } from "@/features/provider-portal/server/session";
import {
  providerPortalBack,
  providerServiceOptions,
} from "@/features/provider-portal/lib/form-page-utils";

export default async function EditServiceProcessPage({
  params,
}: {
  params: Promise<{
    locale: string;
    providerId: string;
    serviceId: string;
    processId: string;
  }>;
}) {
  const { locale, providerId, serviceId, processId } = await params;
  const userId = await requireCurrentUserId();
  await getProviderWorkspace(userId, providerId, locale);
  const [services, related] = await Promise.all([
    listProviderServices(userId, providerId, locale),
    listProviderServiceRelatedRecords(userId, providerId, locale),
  ]);
  const item = related.process.find(
    (row) => row.id === processId && row.providerServiceId === serviceId,
  );
  if (!item) notFound();

  const fields = [
    { name: "providerId", type: "hidden" as const },
    { name: "processId", type: "hidden" as const },
    {
      name: "providerServiceId",
      label: "Service",
      type: "select" as const,
      required: true,
      options: providerServiceOptions(services),
      fullWidth: true,
    },
    {
      name: "step",
      label: "Step number",
      type: "number" as const,
      min: 1,
      required: true,
    },
    { name: "title", label: "Step title", type: "text" as const },
    { name: "duration", label: "Duration label", type: "text" as const },
    {
      name: "description",
      label: "Description",
      type: "textarea" as const,
      rows: 5,
      fullWidth: true,
    },
  ];

  return (
    <ProviderRecordForm
      operation="saveServiceProcess"
      title="Edit process step"
      description="Update this service process step."
      fields={fields}
      initialValues={{
        providerId,
        processId: item.id,
        providerServiceId: item.providerServiceId,
        step: item.step,
        title: item.title || "",
        description: item.description || "",
        duration: item.duration || "",
      }}
      backHref={providerPortalBack(
        providerId,
        `/services/${serviceId}/process`,
      )}
      submitLabel="Save step"
      successMessage="Process step updated."
    />
  );
}
