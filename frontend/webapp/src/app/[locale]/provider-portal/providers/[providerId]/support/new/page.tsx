import { notFound } from "next/navigation";

import { ProviderRecordForm } from "@/features/provider-portal/components/provider-record-form";
import { getProviderWorkspace, listSupportTickets } from "@/features/provider-portal/server/repository";
import { requireCurrentUserId } from "@/features/provider-portal/server/session";
import { providerPortalBack } from "@/features/provider-portal/lib/form-page-utils";

export default async function NewSupportTicketPage({ params }: { params: Promise<{ locale: string; providerId: string }> }) {
  const { locale, providerId } = await params;
  const userId = await requireCurrentUserId();
  await getProviderWorkspace(userId, providerId, locale);

  const fields = [
    { name: "providerId", type: "hidden" as const },
    { name: "subject", label: "Subject", type: "text" as const, required: true, fullWidth: true },
    { name: "message", label: "Message", type: "textarea" as const, rows: 6, required: true, fullWidth: true },
    { name: "priority", label: "Priority", type: "select" as const, options: [{ value: "low", label: "Low" }, { value: "normal", label: "Normal" }, { value: "high", label: "High" }, { value: "urgent", label: "Urgent" }] },
  ];

  return <ProviderRecordForm operation="createSupportTicket" title="Open support ticket" description="Create a ticket for LSevin operations/admin support." fields={fields} initialValues={{ providerId, priority: "normal" }} backHref={providerPortalBack(providerId, "/support")} submitLabel="Create ticket" successMessage="Support ticket created." />;
}
