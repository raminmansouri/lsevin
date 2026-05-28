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

export default async function NewServiceFaqPage({
  params,
}: {
  params: Promise<{ locale: string; providerId: string; serviceId: string }>;
}) {
  const { locale, providerId, serviceId } = await params;
  const userId = await requireCurrentUserId();
  await getProviderWorkspace(userId, providerId, locale);
  const services = await listProviderServices(userId, providerId, locale);
  if (!services.some((item) => item.id === serviceId)) notFound();

  const fields = [
    { name: "providerId", type: "hidden" as const },
    { name: "faqId", type: "hidden" as const },
    {
      name: "providerServiceId",
      label: "Service",
      type: "select" as const,
      required: true,
      options: providerServiceOptions(services),
      fullWidth: true,
    },
    {
      name: "question",
      label: "Question",
      type: "textarea" as const,
      rows: 3,
      fullWidth: true,
    },
    {
      name: "answer",
      label: "Answer",
      type: "textarea" as const,
      rows: 5,
      fullWidth: true,
    },
  ];

  return (
    <ProviderRecordForm
      operation="saveServiceFaq"
      title="Add service FAQ"
      description="Add a customer-facing FAQ for this service."
      fields={fields}
      initialValues={{ providerId, providerServiceId: serviceId }}
      backHref={providerPortalBack(providerId, `/services/${serviceId}/faqs`)}
      submitLabel="Save FAQ"
      successMessage="FAQ saved."
    />
  );
}
