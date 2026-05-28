import { ProviderRecordForm } from "@/features/provider-portal/components/provider-record-form";
import {
  getProviderWorkspace,
  listProviderServices,
} from "@/features/provider-portal/server/repository";
import { requireCurrentUserId } from "@/features/provider-portal/server/session";
import {
  providerPortalBack,
  providerServiceOptions,
} from "@/features/provider-portal/lib/form-page-utils";

export default async function NewServiceIncludedFromServicesPage({
  params,
}: {
  params: Promise<{ locale: string; providerId: string }>;
}) {
  const { locale, providerId } = await params;
  const userId = await requireCurrentUserId();
  await getProviderWorkspace(userId, providerId, locale);
  const services = await listProviderServices(userId, providerId, locale);

  const fields = [
    { name: "providerId", type: "hidden" as const },
    { name: "includedId", type: "hidden" as const },
    {
      name: "providerServiceId",
      label: "Service",
      type: "select" as const,
      required: true,
      options: providerServiceOptions(services),
      fullWidth: true,
    },
    {
      name: "item",
      label: "Included item",
      type: "text" as const,
      required: true,
      fullWidth: true,
    },
  ];

  return (
    <ProviderRecordForm
      operation="saveServiceIncluded"
      title="Add included item"
      description="Choose a service and add one included package item."
      fields={fields}
      initialValues={{ providerId, providerServiceId: services[0]?.id || "" }}
      backHref={providerPortalBack(providerId, "/services/included")}
      submitLabel="Save item"
      successMessage="Included item saved."
    />
  );
}
