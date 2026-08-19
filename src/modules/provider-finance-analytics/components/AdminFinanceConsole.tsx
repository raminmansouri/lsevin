import { Banknote, CircleDollarSign, HandCoins, Landmark, Shuffle, Wallet } from "lucide-react";
import { Badge } from "@core/ui/Badge";
import { Button } from "@core/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@core/ui/Card";
import { Field, Input, Select, Textarea } from "@core/ui/Field";
import { StatCard } from "@core/ui/StatCard";
import { CurrencySelect } from "@core/ui/CurrencySelect";
import { formatDateTime, formatMoney, formatNumber } from "@core/lib/format";
import { approveWithdrawalRequestAction, createManualTransferAction, createWalletAdjustmentAction, markWithdrawalPaidAction, rejectWithdrawalRequestAction } from "../actions";
import type { FinanceAdminOverview, MoneyTransfer, WithdrawalRequest } from "../types";
import { MoneyTransfersTable } from "./MoneyMovementTable";
import { localizeReactTree } from "@core/i18n/localize-tree";

function statusVariant(status: string) {
  if (["completed", "paid", "approved"].includes(status)) return "success" as const;
  if (["failed", "cancelled", "rejected"].includes(status)) return "danger" as const;
  if (["pending", "processing", "requested", "in_review"].includes(status)) return "warning" as const;
  return "neutral" as const;
}

export function AdminFinanceConsole({ overview, transfers, withdrawalRequests, providerIdForForms = "", locale = "en" }: { overview: FinanceAdminOverview; transfers: MoneyTransfer[]; withdrawalRequests: WithdrawalRequest[]; providerIdForForms?: string; locale?: string }) {
  return localizeReactTree((
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard icon={CircleDollarSign} label="Gross revenue" value={formatMoney(overview.totalGrossRevenue, overview.currencyCode)} />
        <StatCard icon={Banknote} label="LSevin compensation" value={formatMoney(overview.totalPlatformFees, overview.currencyCode)} />
        <StatCard icon={Wallet} label="Provider payable" value={formatMoney(overview.totalProviderPayable, overview.currencyCode)} />
        <StatCard icon={Landmark} label="Paid out" value={formatMoney(overview.totalPaidOut, overview.currencyCode)} />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardContent><div className="text-xs text-muted-foreground">Bookings</div><div className="mt-1 text-2xl font-bold">{formatNumber(overview.bookingsCount)}</div></CardContent></Card>
        <Card><CardContent><div className="text-xs text-muted-foreground">Providers with balance</div><div className="mt-1 text-2xl font-bold">{formatNumber(overview.providersWithBalance)}</div></CardContent></Card>
        <Card><CardContent><div className="text-xs text-muted-foreground">Pending withdrawals</div><div className="mt-1 text-2xl font-bold">{formatMoney(overview.pendingWithdrawals, overview.currencyCode)}</div></CardContent></Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_420px]">
        <Card className="overflow-hidden">
          <CardHeader><CardTitle>Withdrawal approvals</CardTitle></CardHeader>
          <div className="divide-y divide-border">
            {withdrawalRequests.length ? withdrawalRequests.map((request) => (
              <div key={request.id} className="p-4">
                <div className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
                  <div>
                    <div className="font-bold">{formatMoney(request.amount, request.currencyCode)}</div>
                    <div className="text-xs text-muted-foreground">Requested {formatDateTime(request.requestedAt)} · provider {request.providerId}</div>
                  </div>
                  <Badge variant={statusVariant(request.status)}>{request.status}</Badge>
                  <div className="flex flex-wrap gap-2">
                    <form action={approveWithdrawalRequestAction}>
                      <input type="hidden" name="providerId" value={request.providerId} />
                      <input type="hidden" name="withdrawalRequestId" value={request.id} />
                      <Button type="submit" variant="secondary" disabled={!['requested','in_review'].includes(request.status)}>Approve</Button>
                    </form>
                    <form action={rejectWithdrawalRequestAction} className="flex gap-2">
                      <input type="hidden" name="providerId" value={request.providerId} />
                      <input type="hidden" name="withdrawalRequestId" value={request.id} />
                      <Input name="reviewNote" placeholder="Reason" className="w-32" />
                      <Button type="submit" variant="danger" disabled={!['requested','in_review','approved'].includes(request.status)}>Reject</Button>
                    </form>
                    <form action={markWithdrawalPaidAction} className="flex gap-2">
                      <input type="hidden" name="providerId" value={request.providerId} />
                      <input type="hidden" name="withdrawalRequestId" value={request.id} />
                      <Input name="gatewayReference" placeholder="Gateway ref" className="w-32" />
                      <Button type="submit" disabled={!['approved','processing'].includes(request.status)}>Mark paid</Button>
                    </form>
                  </div>
                </div>
              </div>
            )) : <CardContent><p className="text-sm text-muted-foreground">No withdrawal requests need attention.</p></CardContent>}
          </div>
        </Card>

        <div className="space-y-5">
          <form action={createWalletAdjustmentAction}>
            <Card>
              <CardHeader><CardTitle>Manual provider wallet adjustment</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <Field label="Provider ID"><Input name="providerId" defaultValue={providerIdForForms} required /></Field>
                <Field label="Currency"><CurrencySelect name="currencyCode" value={overview.currencyCode || "USD"} /></Field>
                <Field label="Direction"><Select name="direction"><option value="credit">Credit provider</option><option value="debit">Debit provider</option></Select></Field>
                <Field label="Amount"><Input name="amount" type="number" min="0" step="0.01" required /></Field>
                <Field label="Notes"><Textarea name="notes" /></Field>
                <Button type="submit"><HandCoins size={16} /> Apply adjustment</Button>
              </CardContent>
            </Card>
          </form>

          <form action={createManualTransferAction}>
            <Card>
              <CardHeader><CardTitle>Record money transfer</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <Field label="Provider ID"><Input name="providerId" defaultValue={providerIdForForms} /></Field>
                <Field label="Source party"><Select name="sourcePartyType"><option value="lsevin">LSevin</option><option value="provider">Provider</option><option value="customer">Customer</option><option value="gateway">Gateway</option><option value="bank">Bank</option></Select></Field>
                <Field label="Target party"><Select name="targetPartyType"><option value="provider">Provider</option><option value="lsevin">LSevin</option><option value="customer">Customer</option><option value="gateway">Gateway</option><option value="bank">Bank</option></Select></Field>
                <Field label="Transfer type"><Select name="transferType"><option value="manual_adjustment">Manual adjustment</option><option value="customer_payment">Customer payment</option><option value="provider_settlement">Provider settlement</option><option value="customer_refund">Customer refund</option><option value="provider_deposit">Provider deposit</option></Select></Field>
                <Field label="Currency"><CurrencySelect name="currencyCode" value={overview.currencyCode || "USD"} /></Field>
                <Field label="Amount"><Input name="amount" type="number" min="0" step="0.01" required /></Field>
                <Field label="Notes"><Textarea name="notes" /></Field>
                <Button type="submit"><Shuffle size={16} /> Record transfer</Button>
              </CardContent>
            </Card>
          </form>
        </div>
      </div>

      <MoneyTransfersTable transfers={transfers} />
    </div>
  ), locale);
}
