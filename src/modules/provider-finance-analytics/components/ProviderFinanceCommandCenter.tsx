import { ArrowDownToLine, Banknote, CircleDollarSign, Landmark, Receipt, Wallet } from "lucide-react";
import { Badge } from "@core/ui/Badge";
import { Button } from "@core/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@core/ui/Card";
import { Field, Input, Select, Textarea } from "@core/ui/Field";
import { StatCard } from "@core/ui/StatCard";
import { CurrencySelect } from "@core/ui/CurrencySelect";
import { formatDate, formatDateTime, formatMoney, formatNumber } from "@core/lib/format";
import { ensureProviderWalletAction, requestWithdrawalAction } from "../actions";
import type { FinanceOverview, PayoutAccount, ProviderWalletAccount, ProviderWalletTransaction, SettlementBatch, WithdrawalRequest } from "../types";
import { WalletTransactionsTable } from "./MoneyMovementTable";
import { localizeReactTree } from "@core/i18n/localize-tree";

function statusVariant(status: string) {
  if (["completed", "paid", "approved"].includes(status)) return "success" as const;
  if (["failed", "cancelled", "rejected"].includes(status)) return "danger" as const;
  if (["pending", "processing", "requested", "in_review"].includes(status)) return "warning" as const;
  return "neutral" as const;
}

export function ProviderFinanceCommandCenter({
  providerId,
  overview,
  walletAccounts,
  walletTransactions,
  payoutAccounts,
  withdrawals,
  settlements,
  locale = "fa-IR",
  timeZone = "Asia/Tehran",
}: {
  providerId: string;
  overview: FinanceOverview;
  walletAccounts: ProviderWalletAccount[];
  walletTransactions: ProviderWalletTransaction[];
  payoutAccounts: PayoutAccount[];
  withdrawals: WithdrawalRequest[];
  settlements: SettlementBatch[];
  locale?: string;
  timeZone?: string;
}) {
  return localizeReactTree((
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard icon={CircleDollarSign} label="Gross revenue" value={formatMoney(overview.grossRevenue, overview.currencyCode, locale)} />
        <StatCard icon={Receipt} label="LSevin compensation" value={formatMoney(overview.platformFeeAmount, overview.currencyCode, locale)} />
        <StatCard icon={Wallet} label="Provider payable" value={formatMoney(overview.providerPayableAmount, overview.currencyCode, locale)} />
        <StatCard icon={Landmark} label="Wallet available" value={formatMoney(overview.walletAvailableAmount, overview.currencyCode, locale)} />
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardContent><div className="text-xs text-muted-foreground">Bookings</div><div className="mt-1 text-2xl font-bold">{formatNumber(overview.bookingsCount, locale)}</div></CardContent></Card>
        <Card><CardContent><div className="text-xs text-muted-foreground">Paid bookings</div><div className="mt-1 text-2xl font-bold">{formatNumber(overview.paidBookingsCount, locale)}</div></CardContent></Card>
        <Card><CardContent><div className="text-xs text-muted-foreground">Average order value</div><div className="mt-1 text-2xl font-bold">{formatMoney(overview.averageOrderValue, overview.currencyCode, locale)}</div></CardContent></Card>
        <Card><CardContent><div className="text-xs text-muted-foreground">Pending withdrawal</div><div className="mt-1 text-2xl font-bold">{formatMoney(overview.withdrawalPendingAmount, overview.currencyCode, locale)}</div></CardContent></Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.2fr_420px]">
        <div className="space-y-5">
          <Card>
            <CardHeader><CardTitle>Provider wallets</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {walletAccounts.length ? walletAccounts.map((wallet) => (
                <div key={wallet.id} className="rounded-lg border border-border p-4">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">{wallet.currencyCode} wallet</div>
                      <div className="mt-1 text-2xl font-bold">{formatMoney(wallet.availableAmount, wallet.currencyCode, locale)}</div>
                      <div className="mt-1 text-xs text-muted-foreground">Pending: {formatMoney(wallet.pendingAmount, wallet.currencyCode, locale)} · Locked: {formatMoney(wallet.lockedAmount, wallet.currencyCode, locale)}</div>
                    </div>
                    <Badge variant={statusVariant(wallet.status)}>{wallet.status}</Badge>
                  </div>
                </div>
              )) : <p className="text-sm text-muted-foreground">No wallet exists for this provider yet.</p>}

              <form action={ensureProviderWalletAction} className="rounded-lg border border-dashed border-border p-4">
                <input type="hidden" name="providerId" value={providerId} />
                <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                  <Field label="Create wallet currency"><CurrencySelect name="currencyCode" value="USD" /></Field>
                  <div className="flex items-end"><Button type="submit">Ensure wallet</Button></div>
                </div>
              </form>
            </CardContent>
          </Card>

          <WalletTransactionsTable transactions={walletTransactions} locale={locale} timeZone={timeZone} />
        </div>

        <div className="space-y-5">
          <form action={requestWithdrawalAction}>
            <input type="hidden" name="providerId" value={providerId} />
            <Card>
              <CardHeader><CardTitle>Request تسویه مالی</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <Field label="Currency"><CurrencySelect name="currencyCode" value={overview.currencyCode || "USD"} /></Field>
                <Field label="Amount"><Input name="amount" type="number" min="0" step="0.01" required /></Field>
                <Field label="Payout account">
                  <Select name="payoutAccountId" defaultValue={payoutAccounts.find((item) => item.isDefault)?.id || ""}>
                    <option value="">No payout account selected</option>
                    {payoutAccounts.map((account) => <option key={account.id} value={account.id}>{account.accountHolderName} · {account.bankName || account.currencyCode}</option>)}
                  </Select>
                </Field>
                <p className="text-xs text-muted-foreground">The amount is locked until admin approves, rejects, or pays the withdrawal.</p>
                <Button type="submit"><ArrowDownToLine size={16} /> Request withdrawal</Button>
              </CardContent>
            </Card>
          </form>

          <Card>
            <CardHeader><CardTitle>Recent withdrawals</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {withdrawals.length ? withdrawals.map((request) => (
                <div key={request.id} className="rounded-lg border border-border p-3">
                  <div className="flex items-center justify-between gap-3"><b>{formatMoney(request.amount, request.currencyCode, locale)}</b><Badge variant={statusVariant(request.status)}>{request.status}</Badge></div>
                  <div className="mt-1 text-xs text-muted-foreground">Requested {formatDateTime(request.requestedAt, locale, timeZone)}</div>
                  {request.reviewNote ? <div className="mt-2 rounded-md bg-muted p-2 text-xs">{request.reviewNote}</div> : null}
                </div>
              )) : <p className="text-sm text-muted-foreground">No withdrawals yet.</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Latest settlements</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {settlements.length ? settlements.slice(0, 5).map((settlement) => (
                <div key={settlement.id} className="rounded-lg border border-border p-3">
                  <div className="flex items-center justify-between gap-3"><b>{settlement.settlementNumber}</b><Badge variant={statusVariant(settlement.status)}>{settlement.status}</Badge></div>
                  <div className="mt-1 text-sm font-semibold">{formatMoney(settlement.payoutAmount, settlement.currencyCode, locale)}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{formatDate(settlement.periodStart, locale, timeZone)} → {formatDate(settlement.periodEnd, locale, timeZone)}</div>
                </div>
              )) : <p className="text-sm text-muted-foreground">No settlement batch has been created.</p>}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  ), locale);
}
