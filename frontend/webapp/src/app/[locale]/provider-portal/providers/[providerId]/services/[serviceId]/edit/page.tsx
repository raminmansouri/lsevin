import { notFound } from "next/navigation";

import { ProviderRecordForm } from "@/features/provider-portal/components/provider-record-form";
import {
  getProviderWorkspace,
  listProviderServices,
  listServiceDefinitionOptions,
} from "@/features/provider-portal/server/repository";
import { requireCurrentUserId } from "@/features/provider-portal/server/session";
import {
  csv,
  providerPortalBack,
  serviceDefinitionOptions,
  tr,
} from "@/features/provider-portal/lib/form-page-utils";

export default async function EditProviderServicePage({
  params,
}: {
  params: Promise<{ locale: string; providerId: string; serviceId: string }>;
}) {
  const { locale, providerId, serviceId } = await params;
  const userId = await requireCurrentUserId();
  await getProviderWorkspace(userId, providerId, locale);
  const [services, definitions] = await Promise.all([
    listProviderServices(userId, providerId, locale),
    listServiceDefinitionOptions(locale),
  ]);
  const service = services.find((item) => item.id === serviceId);
  if (!service) notFound();

  const fields = [
    { name: "providerId", type: "hidden" as const },
    { name: "serviceId", type: "hidden" as const },
    {
      name: "serviceDefinitionId",
      label: "Global service definition",
      type: "select" as const,
      required: true,
      options: serviceDefinitionOptions(definitions),
      fullWidth: true,
    },
    {
      name: "nameEn",
      label: "Service name English",
      type: "text" as const,
      required: true,
    },
    { name: "nameFa", label: "Service name Persian", type: "text" as const },
    {
      name: "descriptionEn",
      label: "Description English",
      type: "textarea" as const,
      rows: 5,
      fullWidth: true,
    },
    {
      name: "descriptionFa",
      label: "Description Persian",
      type: "textarea" as const,
      rows: 5,
      fullWidth: true,
    },
    {
      name: "imageUrl",
      label: "Image URL / media id",
      type: "text" as const,
      fullWidth: true,
      helpText:
        "Compatible with your media picker and NEXT_PUBLIC_FILES_URL image rendering.",
    },
    {
      name: "currency",
      label: "Currency",
      type: "text" as const,
      required: true,
    },
    {
      name: "value",
      label: "Price",
      type: "number" as const,
      step: "0.01",
      min: 0,
    },
    {
      name: "durationMinutes",
      label: "Duration minutes",
      type: "number" as const,
      min: 0,
    },
    {
      name: "slotIntervalMinutes",
      label: "Slot interval minutes",
      type: "number" as const,
      min: 1,
    },
    {
      name: "tagsCsv",
      label: "Tags CSV",
      type: "text" as const,
      fullWidth: true,
      placeholder: "VIP, Dental, Popular",
    },
    { name: "isActive", label: "Active", type: "checkbox" as const },
    { name: "isPopular", label: "Popular", type: "checkbox" as const },
  ];

  return (
    <ProviderRecordForm
      operation="saveProviderService"
      title="Edit service"
      description="Update this provider-owned service."
      fields={fields}
      initialValues={{
        providerId,
        serviceId: service.id,
        serviceDefinitionId: service.serviceDefinitionId,
        nameEn: tr(service.displayName, "en-US"),
        nameFa: tr(service.displayName, "fa-IR"),
        descriptionEn: tr(service.description, "en-US"),
        descriptionFa: tr(service.description, "fa-IR"),
        currency: service.currency,
        value: service.value,
        durationMinutes: service.durationMinutes,
        slotIntervalMinutes: service.slotIntervalMinutes,
        imageUrl: service.imageUrl || "",
        isActive: service.isActive,
        isPopular: service.isPopular,
        tagsCsv: csv(service.tags),
      }}
      backHref={providerPortalBack(providerId, "/services")}
      submitLabel="Save service"
      successMessage="Service updated."
    />
  );
}
