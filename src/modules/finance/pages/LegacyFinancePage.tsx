import { PageHeader } from "@core/ui/PageHeader";
import type { ModulePageProps } from "@core/modules/types";
import { FinanceManager } from "../components/FinanceManager";
import { getFinanceSummary, listLedger, listPayoutAccounts } from "../repository";

export async function LegacyFinancePage({ params }: ModulePageProps) {
  const providerId = params.providerId;
  const [summary, ledger, accounts] = await Promise.all([getFinanceSummary(providerId), listLedger(providerId), listPayoutAccounts(providerId)]);
  return <div><PageHeader title="Finance legacy" description="Legacy payout accounts, provider ledger and settlement readiness." /><FinanceManager providerId={providerId} summary={summary} ledger={ledger} accounts={accounts} /></div>;
}
