import { SupportManager } from "@/features/provider-portal/components/support-manager";
import {
  getProviderWorkspace,
  listSupportTickets,
} from "@/features/provider-portal/server/repository";
import { requireCurrentUserId } from "@/features/provider-portal/server/session";

export default async function ProviderSupportFormPage({
  params,
}: {
  params: Promise<{ locale: string; providerId: string; ticketId?: string }>;
}) {
  const { locale, providerId } = await params;
  const userId = await requireCurrentUserId();

  const [workspace, tickets] = await Promise.all([
    getProviderWorkspace(userId, providerId, locale),
    listSupportTickets(userId, providerId),
  ]);

  return <SupportManager workspace={workspace} tickets={tickets} />;
}
