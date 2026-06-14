import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { ProviderRecordForm } from "@/features/provider-portal/components/provider-record-form";
import {
  getProviderWorkspace,
  listSupportTickets,
} from "@/features/provider-portal/server/repository";
import { requireCurrentUserId } from "@/features/provider-portal/server/session";
import { providerPortalBack } from "@/features/provider-portal/lib/form-page-utils";

export default async function UpdateSupportTicketStatusPage({
  params,
}: {
  params: Promise<{ locale: string; providerId: string; ticketId: string }>;
}) {
  const { locale, providerId, ticketId } = await params;
  const t = await getTranslations({ locale, namespace: "SupportPages.providerPortalStatus" });
  const userId = await requireCurrentUserId();
  await getProviderWorkspace(userId, providerId, locale);
  const ticket = (await listSupportTickets(userId, providerId)).find(
    (item) => item.id === ticketId,
  );
  if (!ticket) notFound();
  const fields = [
    { name: "providerId", type: "hidden" as const },
    { name: "ticketId", type: "hidden" as const },
    {
      name: "status",
      label: t("status"),
      type: "select" as const,
      required: true,
      options: [
        { value: "open", label: t("open") },
        { value: "in_progress", label: t("inProgress") },
        { value: "resolved", label: t("resolved") },
        { value: "closed", label: t("closed") },
      ],
    },
  ];

  return (
    <ProviderRecordForm
      operation="updateSupportTicket"
      title={t("title")}
      description={ticket.subject}
      fields={fields}
      initialValues={{ providerId, ticketId: ticket.id, status: ticket.status }}
      backHref={providerPortalBack(providerId, "/support")}
      submitLabel={t("saveStatus")}
      successMessage={t("successMessage")}
    />
  );
}
