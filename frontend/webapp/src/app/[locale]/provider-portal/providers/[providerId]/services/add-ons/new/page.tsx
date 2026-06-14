import { ProviderRecordForm } from "@/features/provider-portal/components/provider-record-form";
import {
  getProviderWorkspace,
  listProviderServiceRelatedRecords,
  listProviderServices,
} from "@/features/provider-portal/server/repository";
import { requireCurrentUserId } from "@/features/provider-portal/server/session";
import {
  addonOptions,
  providerPortalBack,
  providerServiceOptions,
} from "@/features/provider-portal/lib/form-page-utils";

export default async function NewServiceAddonFromServicesPage({
  params,
}: {
  params: Promise<{ locale: string; providerId: string }>;
}) {
  const { locale, providerId } = await params;
  const userId = await requireCurrentUserId();
  await getProviderWorkspace(userId, providerId, locale);
  const [services, related] = await Promise.all([
    listProviderServices(userId, providerId, locale),
    listProviderServiceRelatedRecords(userId, providerId, locale),
  ]);

  const fields = [
    { name: "providerId", type: "hidden" as const },
    {
      name: "providerServiceId",
      label: "Service",
      type: "select" as const,
      required: true,
      options: providerServiceOptions(services),
      fullWidth: true,
    },
    {
      name: "addonId",
      label: "Add-on",
      type: "select" as const,
      required: true,
      options: addonOptions(related.addonOptions),
      fullWidth: true,
    },
    {
      name: "customPrice",
      label: "Custom price",
      type: "number" as const,
      step: "0.01",
      min: 0,
      helpText: "Leave empty to use default add-on price.",
    },
    { name: "isEnabled", label: "Enabled", type: "checkbox" as const },
  ];

  return (
    <ProviderRecordForm
      operation="saveServiceAddonSetting"
      title="Add service add-on"
      description="Choose a service and enable one provider-owned add-on setting."
      fields={fields}
      initialValues={{
        providerId,
        providerServiceId: services[0]?.id || "",
        addonId: related.addonOptions[0]?.id || "",
        isEnabled: true,
      }}
      backHref={providerPortalBack(providerId, "/services/add-ons")}
      submitLabel="Save add-on"
      successMessage="Add-on saved."
    />
  );
}
