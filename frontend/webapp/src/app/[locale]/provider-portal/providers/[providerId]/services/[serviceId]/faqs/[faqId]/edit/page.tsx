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

export default async function EditServiceFaqPage({
  params,
}: {
  params: Promise<{
    locale: string;
    providerId: string;
    serviceId: string;
    faqId: string;
  }>;
}) {
  const { locale, providerId, serviceId, faqId } = await params;
  const userId = await requireCurrentUserId();
  await getProviderWorkspace(userId, providerId, locale);
  const [services, related] = await Promise.all([
    listProviderServices(userId, providerId, locale),
    listProviderServiceRelatedRecords(userId, providerId, locale),
  ]);
  const item = related.faqs.find(
    (row) => row.id === faqId && row.providerServiceId === serviceId,
  );
  if (!item) notFound();

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
      title="Edit service FAQ"
      description="Update this service FAQ."
      fields={fields}
      initialValues={{
        providerId,
        faqId: item.id,
        providerServiceId: item.providerServiceId,
        question: item.question || "",
        answer: item.answer || "",
      }}
      backHref={providerPortalBack(providerId, `/services/${serviceId}/faqs`)}
      submitLabel="Save FAQ"
      successMessage="FAQ updated."
    />
  );
}
