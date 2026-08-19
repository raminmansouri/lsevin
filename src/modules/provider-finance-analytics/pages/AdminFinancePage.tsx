import { AdminFinanceConsole } from "../components/AdminFinanceConsole";
import { CompensationPoliciesManager } from "../components/CompensationPoliciesManager";
import { getAdminFinanceOverview, listCompensationPolicies, listRecentMoneyTransfers, listWithdrawalRequests } from "../repository";
import { dateRangeFromSearch, first, type ModulePageProps } from "./_helpers";
import { getProviderTimeZone } from "@core/providers/timezone";
import { getPortalLocale } from "@core/i18n/server";
import { Card, CardContent, CardHeader, CardTitle } from "@core/ui/Card";

export async function AdminFinancePage({ searchParams }: ModulePageProps) {
  const providerId = first(searchParams?.providerId, "");
  const [timeZone, locale] = await Promise.all([providerId ? getProviderTimeZone(providerId) : Promise.resolve("Asia/Tehran"), getPortalLocale()]);
  const range = dateRangeFromSearch(searchParams, timeZone);
  const [overview, transfers, withdrawalRequests, policies] = await Promise.all([
    getAdminFinanceOverview(range),
    listRecentMoneyTransfers(100),
    providerId ? listWithdrawalRequests(providerId, 100) : Promise.resolve([]),
    listCompensationPolicies(),
  ]);
  return <div className="space-y-6">
    <Card>
      <CardHeader><CardTitle>How provider finance works</CardTitle></CardHeader>
      <CardContent>
        <div className="grid gap-3 md:grid-cols-5">
          {[
            ["1. Customer payment", "The booking payment becomes canonical charge lines."],
            ["2. Provider payable", "LSevin fee, discounts and refunds are separated from the provider entitlement."],
            ["3. Provider ledger", "Approved earnings and reversals are recorded before money reaches the wallet."],
            ["4. Settlement", "Admin groups approved ledger rows and credits the provider wallet after approval."],
            ["5. Withdrawal", "The provider requests payout from available wallet balance to a verified payout account."],
          ].map(([title, description]) => <div key={title} className="rounded-xl border border-border bg-muted/30 p-4"><div className="font-bold text-slate-950">{title}</div><p className="mt-2 text-xs leading-5 text-muted-foreground">{description}</p></div>)}
        </div>
        <div className="mt-4 grid gap-2 text-sm md:grid-cols-4">
          <div className="rounded-lg bg-muted p-3"><b>Provider payable</b><div className="mt-1 text-xs text-muted-foreground">Accounting entitlement; not yet withdrawable cash.</div></div>
          <div className="rounded-lg bg-muted p-3"><b>Settlement</b><div className="mt-1 text-xs text-muted-foreground">Admin reconciliation that converts approved ledger entitlement into wallet credit.</div></div>
          <div className="rounded-lg bg-muted p-3"><b>Wallet available</b><div className="mt-1 text-xs text-muted-foreground">Settled balance that may be requested for payout.</div></div>
          <div className="rounded-lg bg-muted p-3"><b>Withdrawal</b><div className="mt-1 text-xs text-muted-foreground">Request to move wallet money to the provider's payout account.</div></div>
        </div>
      </CardContent>
    </Card>
    <AdminFinanceConsole overview={overview} transfers={transfers} withdrawalRequests={withdrawalRequests} providerIdForForms={providerId} />
    <CompensationPoliciesManager policies={policies} locale={locale.header} timeZone={timeZone} />
  </div>;
}
