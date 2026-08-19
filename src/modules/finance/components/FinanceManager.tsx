import { CreditCard, Landmark, Trash2, Wallet } from "lucide-react";
import { Button } from "@core/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@core/ui/Card";
import { Field, Input } from "@core/ui/Field";
import { CountrySelect } from "@core/ui/CountrySelect";
import { CurrencySelect } from "@core/ui/CurrencySelect";
import { StatCard } from "@core/ui/StatCard";
import { Badge } from "@core/ui/Badge";
import { formatDateTime, formatMoney } from "@core/lib/format";
import { addPayoutAccountAction, deletePayoutAccountAction, setDefaultPayoutAccountAction } from "../actions";
import type { FinanceSummary, LedgerEntry, PayoutAccount } from "../types";

export function FinanceManager({ providerId, summary, ledger, accounts }: { providerId: string; summary: FinanceSummary; ledger: LedgerEntry[]; accounts: PayoutAccount[] }) {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard icon={Wallet} label="Pending earnings" value={formatMoney(summary.pendingEarnings, summary.currencyCode)} />
        <StatCard icon={CreditCard} label="Approved earnings" value={formatMoney(summary.approvedEarnings, summary.currencyCode)} />
        <StatCard icon={Landmark} label="Paid amount" value={formatMoney(summary.paidAmount, summary.currencyCode)} />
      </div>
      <div className="grid gap-5 lg:grid-cols-[1fr_420px]">
        <Card className="overflow-hidden"><CardHeader><CardTitle>Ledger</CardTitle></CardHeader><div className="divide-y divide-border">{ledger.length ? ledger.map((entry) => <div key={entry.id} className="grid gap-2 p-4 md:grid-cols-[1fr_auto_auto]"><div><div className="font-bold capitalize">{entry.entryType}</div><div className="text-xs text-muted-foreground">{formatDateTime(entry.createdAt)} · {entry.notes ?? "No notes"}</div></div><Badge>{entry.status}</Badge><div className="font-bold">{formatMoney(entry.amount, entry.currencyCode)}</div></div>) : <div className="p-5 text-sm text-muted-foreground">No ledger entries yet.</div>}</div></Card>
        <div className="space-y-5">
          <Card><CardHeader><CardTitle>Payout accounts</CardTitle></CardHeader><CardContent className="space-y-3">{accounts.length ? accounts.map((account) => <div key={account.id} className="rounded-lg border border-border p-3"><div className="flex items-start justify-between gap-3"><div><div className="font-bold">{account.accountHolderName}</div><div className="text-sm text-muted-foreground">{account.bankName || "Bank"} · {account.currencyCode}</div><div className="truncate text-xs text-muted-foreground">{account.iban}</div></div>{account.isDefault ? <Badge variant="success">Default</Badge> : null}</div><div className="mt-3 flex gap-2"><form action={setDefaultPayoutAccountAction}><input type="hidden" name="providerId" value={providerId} /><input type="hidden" name="accountId" value={account.id} /><Button type="submit" variant="secondary" disabled={account.isDefault}>Set default</Button></form><form action={deletePayoutAccountAction}><input type="hidden" name="providerId" value={providerId} /><input type="hidden" name="accountId" value={account.id} /><Button type="submit" variant="ghost" className="text-red-600"><Trash2 size={15} /></Button></form></div></div>) : <div className="text-sm text-muted-foreground">No payout accounts yet.</div>}</CardContent></Card>
          <form action={addPayoutAccountAction}>
            <input type="hidden" name="providerId" value={providerId} />
            <Card><CardHeader><CardTitle>Add payout account</CardTitle></CardHeader><CardContent className="space-y-4"><Field label="Account holder"><Input name="accountHolderName" required /></Field><Field label="Bank name"><Input name="bankName" /></Field><Field label="IBAN"><Input name="iban" /></Field><Field label="SWIFT"><Input name="swiftCode" /></Field><Field label="کشور"><CountrySelect name="country" /></Field><Field label="ارز"><CurrencySelect name="currencyCode" value="IRR" /></Field><label className="flex items-center gap-2 text-sm"><input type="checkbox" name="isDefault" /> Default</label><Button type="submit">Add account</Button></CardContent></Card>
          </form>
        </div>
      </div>
    </div>
  );
}
