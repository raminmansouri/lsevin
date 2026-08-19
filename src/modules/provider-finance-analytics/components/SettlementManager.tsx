import { CheckCircle2, ReceiptText, Send } from "lucide-react";
import { Badge } from "@core/ui/Badge";
import { Button } from "@core/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@core/ui/Card";
import { Field, Input, Textarea } from "@core/ui/Field";
import { formatDate, formatDateTime, formatMoney } from "@core/lib/format";
import { CurrencySelect } from "@core/ui/CurrencySelect";
import { LocalizedDateInput } from "@core/ui/LocalizedDateInput";
import { approveSettlementBatchAction, createSettlementBatchAction, issueSettlementPaymentDocumentAction, markSettlementPaidAction } from "../actions";
import type { SettlementBatch } from "../types";
import { localizeReactTree } from "@core/i18n/localize-tree";

function statusVariant(status: string) {
  if (["paid", "approved"].includes(status)) return "success" as const;
  if (["cancelled", "failed"].includes(status)) return "danger" as const;
  if (["draft", "processing"].includes(status)) return "warning" as const;
  return "neutral" as const;
}

export function SettlementManager({ providerId, settlements, adminMode = false, locale = "fa-IR", timeZone = "Asia/Tehran" }: { providerId: string; settlements: SettlementBatch[]; adminMode?: boolean; locale?: string; timeZone?: string }) {
  return localizeReactTree((
    <div className="grid gap-5 xl:grid-cols-[1fr_420px]">
      <Card className="overflow-hidden">
        <CardHeader><CardTitle>Settlement batches</CardTitle></CardHeader>
        <div className="divide-y divide-border">
          {settlements.length ? settlements.map((settlement) => (
            <div key={settlement.id} className="p-4">
              <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto]">
                <div>
                  <div className="font-bold">{settlement.settlementNumber}</div>
                  <div className="text-xs text-muted-foreground">{formatDate(settlement.periodStart, locale, timeZone)} → {formatDate(settlement.periodEnd, locale, timeZone)} · created {formatDateTime(settlement.createdAt, locale, timeZone)}</div>
                </div>
                <Badge variant={statusVariant(settlement.status)}>{settlement.status}</Badge>
                <div className="text-right font-bold">{formatMoney(settlement.payoutAmount, settlement.currencyCode, locale)}</div>
              </div>
              <div className="mt-3 grid gap-2 text-sm md:grid-cols-4">
                <div className="rounded-md bg-muted p-2"><span className="text-muted-foreground">Gross</span><br />{formatMoney(settlement.grossAmount, settlement.currencyCode, locale)}</div>
                <div className="rounded-md bg-muted p-2"><span className="text-muted-foreground">LSevin fee</span><br />{formatMoney(settlement.platformFeeAmount, settlement.currencyCode, locale)}</div>
                <div className="rounded-md bg-muted p-2"><span className="text-muted-foreground">Provider payable</span><br />{formatMoney(settlement.providerPayableAmount, settlement.currencyCode, locale)}</div>
                <div className="rounded-md bg-muted p-2"><span className="text-muted-foreground">Adjustment</span><br />{formatMoney(settlement.adjustmentAmount, settlement.currencyCode, locale)}</div>
              </div>
              {adminMode ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  <form action={approveSettlementBatchAction}>
                    <input type="hidden" name="providerId" value={providerId} />
                    <input type="hidden" name="settlementBatchId" value={settlement.id} />
                    <Button type="submit" variant="secondary" disabled={settlement.status !== "draft"}><CheckCircle2 size={16} /> Approve + credit wallet</Button>
                  </form>
                  <form action={issueSettlementPaymentDocumentAction}>
                    <input type="hidden" name="providerId" value={providerId} />
                    <input type="hidden" name="settlementBatchId" value={settlement.id} />
                    <Button type="submit" variant="secondary" disabled={!["approved", "processing", "paid"].includes(settlement.status)}><ReceiptText size={16} /> Payment doc</Button>
                  </form>
                  <form action={markSettlementPaidAction} className="flex gap-2">
                    <input type="hidden" name="providerId" value={providerId} />
                    <input type="hidden" name="settlementBatchId" value={settlement.id} />
                    <Input name="externalReference" placeholder="Bank/gateway ref" className="w-44" />
                    <Button type="submit" disabled={!['approved','processing'].includes(settlement.status)}><Send size={16} /> Mark paid</Button>
                  </form>
                </div>
              ) : null}
            </div>
          )) : <CardContent><p className="text-sm text-muted-foreground">No settlements found.</p></CardContent>}
        </div>
      </Card>

      {adminMode ? (
        <form action={createSettlementBatchAction}>
          <input type="hidden" name="providerId" value={providerId} />
          <input type="hidden" name="timeZone" value={timeZone} />
          <Card>
            <CardHeader><CardTitle>Create settlement from approved ledger</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Field label="Period start"><LocalizedDateInput name="periodStart" locale={locale} timeZone={timeZone} required /></Field>
              <Field label="Period end"><LocalizedDateInput name="periodEnd" locale={locale} timeZone={timeZone} required /></Field>
              <Field label="Currency"><CurrencySelect name="currencyCode" value="USD" /></Field>
              <Field label="Notes"><Textarea name="notes" /></Field>
              <p className="text-xs text-muted-foreground">Only approved provider ledger rows that are not already attached to another settlement are included.</p>
              <Button type="submit"><ReceiptText size={16} /> Generate batch</Button>
            </CardContent>
          </Card>
        </form>
      ) : (
        <Card>
          <CardHeader><CardTitle>How settlements work</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>1. LSevin calculates compensation from charge lines and provider ledgers.</p>
            <p>2. Admin creates and approves a settlement batch.</p>
            <p>3. Approved settlements credit the provider wallet.</p>
            <p>4. Provider can request تسویه مالی from wallet balance.</p>
          </CardContent>
        </Card>
      )}
    </div>
  ), locale);
}
