import { ProviderRecordForm } from "@/features/provider-portal/components/provider-record-form";
import { getProviderWorkspace, listProviderServices } from "@/features/provider-portal/server/repository";
import { requireCurrentUserId } from "@/features/provider-portal/server/session";
import { providerPortalBack, providerServiceOptions } from "@/features/provider-portal/lib/form-page-utils";

export default async function NewServiceFaqFromServicesPage({ params }: { params: Promise<{ locale: string; providerId: string }> }) {
  const { locale, providerId } = await params;
  const userId = await requireCurrentUserId();
  await getProviderWorkspace(userId, providerId, locale);
  const services = await listProviderServices(userId, providerId, locale);

  const fields = [
    { name: "providerId", type: "hidden" as const },
    { name: "faqId", type: "hidden" as const },
    { name: "providerServiceId", label: "Service", type: "select" as const, required: true, options: providerServiceOptions(services), fullWidth: true },
    { name: "question", label: "Question", type: "textarea" as const, rows: 3, fullWidth: true },
    { name: "answer", label: "Answer", type: "textarea" as const, rows: 5, fullWidth: true },
  ];

  return <ProviderRecordForm operation="saveServiceFaq" title="Add service FAQ" description="Choose a service and add one customer-facing FAQ." fields={fields} initialValues={{ providerId, providerServiceId: services[0]?.id || "" }} backHref={providerPortalBack(providerId, "/services/faqs")} submitLabel="Save FAQ" successMessage="FAQ saved." />;
}
