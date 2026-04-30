import { BillingManager } from "@/features/provider-portal/components/billing-manager";
import { getProviderWorkspace, listBilling } from "@/features/provider-portal/server/repository";
import { requireCurrentUserId } from "@/features/provider-portal/server/session";

export default async function ProviderPayoutAccountsPage({ params }: { params: Promise<{ locale: string; providerId: string }> }) {
  const { locale, providerId } = await params;
  const userId = await requireCurrentUserId();

  const [workspace, billing] = await Promise.all([
    getProviderWorkspace(userId, providerId, locale),
    listBilling(userId, providerId),
  ]);

  return <BillingManager workspace={workspace} ledgers={billing.ledgers} payoutAccounts={billing.payoutAccounts} />;
}
