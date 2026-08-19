import { ProviderFinanceCommandCenter } from "../components/ProviderFinanceCommandCenter";
import {
  getProviderFinanceOverview,
  listPayoutAccounts,
  listProviderWalletAccounts,
  listProviderWalletTransactions,
  listSettlementBatches,
  listWithdrawalRequests,
} from "../repository";
import { dateRangeFromSearch, requireParam, type ModulePageProps } from "./_helpers";
import { getProviderTimeZone } from "@core/providers/timezone";
import { getPortalLocale } from "@core/i18n/server";

export async function ProviderFinancePage({ params, searchParams }: ModulePageProps) {
  const providerId = requireParam(params, "providerId");
  const [timeZone, locale] = await Promise.all([getProviderTimeZone(providerId), getPortalLocale()]);
  const range = dateRangeFromSearch(searchParams, timeZone);
  const [overview, walletAccounts, walletTransactions, payoutAccounts, withdrawals, settlements] = await Promise.all([
    getProviderFinanceOverview(providerId, range),
    listProviderWalletAccounts(providerId),
    listProviderWalletTransactions(providerId),
    listPayoutAccounts(providerId),
    listWithdrawalRequests(providerId),
    listSettlementBatches(providerId),
  ]);

  return (
    <ProviderFinanceCommandCenter
      providerId={providerId}
      overview={overview}
      walletAccounts={walletAccounts}
      walletTransactions={walletTransactions}
      payoutAccounts={payoutAccounts}
      withdrawals={withdrawals}
      settlements={settlements}
      locale={locale.header}
      timeZone={timeZone}
    />
  );
}
