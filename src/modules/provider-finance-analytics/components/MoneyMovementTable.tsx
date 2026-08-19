import { Badge } from "@core/ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@core/ui/Card";
import { formatDateTime, formatMoney } from "@core/lib/format";
import type { MoneyTransfer, ProviderWalletTransaction } from "../types";
import { localizeReactTree } from "@core/i18n/localize-tree";

function statusVariant(status: string) {
  if (["completed", "paid", "approved"].includes(status)) return "success" as const;
  if (["failed", "cancelled", "rejected", "reversed"].includes(status)) return "danger" as const;
  if (["pending", "processing", "in_review", "requested"].includes(status)) return "warning" as const;
  return "neutral" as const;
}

export function WalletTransactionsTable({ transactions, locale = "fa-IR", timeZone = "Asia/Tehran" }: { transactions: ProviderWalletTransaction[]; locale?: string; timeZone?: string }) {
  return localizeReactTree((
    <Card className="overflow-hidden">
      <CardHeader><CardTitle>Provider wallet transactions</CardTitle></CardHeader>
      <div className="divide-y divide-border">
        {transactions.length ? transactions.map((tx) => (
          <div key={tx.id} className="grid gap-3 p-4 md:grid-cols-[1fr_auto_auto]">
            <div>
              <div className="font-semibold capitalize">{tx.transactionType.replaceAll("_", " ")}</div>
              <div className="text-xs text-muted-foreground">{formatDateTime(tx.createdAt, locale, timeZone)} · {tx.notes || tx.referenceType || "No notes"}</div>
            </div>
            <Badge variant={statusVariant(tx.status)}>{tx.status}</Badge>
            <div className={tx.direction === "credit" ? "font-bold text-emerald-700" : "font-bold text-red-700"}>{tx.direction === "credit" ? "+" : "-"}{formatMoney(tx.amount, tx.currencyCode, locale)}</div>
          </div>
        )) : <CardContent><p className="text-sm text-muted-foreground">No wallet movement has been recorded yet.</p></CardContent>}
      </div>
    </Card>
  ), locale);
}

export function MoneyTransfersTable({ transfers, locale = "fa-IR", timeZone = "Asia/Tehran" }: { transfers: MoneyTransfer[]; locale?: string; timeZone?: string }) {
  return localizeReactTree((
    <Card className="overflow-hidden">
      <CardHeader><CardTitle>Money movement between LSevin, provider and customer</CardTitle></CardHeader>
      <div className="divide-y divide-border">
        {transfers.length ? transfers.map((transfer) => (
          <div key={transfer.id} className="grid gap-3 p-4 md:grid-cols-[1.4fr_1fr_auto_auto]">
            <div>
              <div className="font-semibold capitalize">{transfer.transferType.replaceAll("_", " ")}</div>
              <div className="text-xs text-muted-foreground">{formatDateTime(transfer.createdAt, locale, timeZone)} · {transfer.notes || transfer.referenceType || "No note"}</div>
            </div>
            <div className="text-sm text-muted-foreground">{transfer.sourcePartyType} → {transfer.targetPartyType}</div>
            <Badge variant={statusVariant(transfer.status)}>{transfer.status}</Badge>
            <div className="font-bold">{formatMoney(transfer.amount, transfer.currencyCode, locale)}</div>
          </div>
        )) : <CardContent><p className="text-sm text-muted-foreground">No transfers are available.</p></CardContent>}
      </div>
    </Card>
  ), locale);
}
