import { Badge } from "@core/ui/Badge";
import { Button } from "@core/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@core/ui/Card";
import { CurrencySelect } from "@core/ui/CurrencySelect";
import { Field, Input, Select, Textarea } from "@core/ui/Field";
import { LocalizedDateInput } from "@core/ui/LocalizedDateInput";
import { LazySearchSelect } from "@core/ui/LazySearchSelect";
import { StatCard } from "@core/ui/StatCard";
import { Banknote, CircleDollarSign, HandCoins, ReceiptText, WalletCards } from "lucide-react";
import { formatDate, formatMoney } from "@core/lib/format";
import {
  disableStaffCompensationRuleAction,
  markStaffBookingCompensationPaidAction,
  saveStaffCompensationRuleAction,
} from "../actions";
import type { BookingEarningRow, BookingEarningsSummary, StaffCompensationRule } from "../types";

function statusVariant(status: string | null | undefined) {
  const value = (status || "").toLowerCase();
  if (["paid", "completed", "approved", "succeeded", "captured"].includes(value)) return "success" as const;
  if (["failed", "cancelled", "canceled", "rejected"].includes(value)) return "danger" as const;
  if (["pending", "processing", "requested", "in_review", "draft"].includes(value)) return "warning" as const;
  return "neutral" as const;
}

export function BookingEarningsPanel({
  providerId,
  from,
  to,
  currencyCode,
  rows,
  summary,
  rules,
  locale = "fa-IR",
  timeZone = "Asia/Tehran",
}: {
  providerId: string;
  from: string;
  to: string;
  currencyCode: string;
  rows: BookingEarningRow[];
  summary: BookingEarningsSummary;
  rules: StaffCompensationRule[];
  locale?: string;
  timeZone?: string;
}) {
  return (
    <div className="space-y-5">
      <Card>
        <CardHeader><CardTitle>Booking-linked earnings</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <form method="get" className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto]">
            <Field label="From"><LocalizedDateInput name="from" value={from} locale={locale} timeZone={timeZone} /></Field>
            <Field label="To"><LocalizedDateInput name="to" value={to} locale={locale} timeZone={timeZone} /></Field>
            <Field label="Settlement currency"><CurrencySelect name="currencyCode" value={currencyCode} /></Field>
            <div className="flex items-end"><Button type="submit" variant="secondary">Apply</Button></div>
          </form>
          <p className="text-xs text-muted-foreground">
            Revenue and provider payable are read from canonical LSevin commercial charge/refund/ledger data in settlement currency. Staff compensation is provider-defined and does not replace the LSevin provider ledger.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        <StatCard icon={CircleDollarSign} label="Settlement gross" value={formatMoney(summary.grossAmount, currencyCode)} />
        <StatCard icon={ReceiptText} label="LSevin fee" value={formatMoney(summary.platformFeeAmount, currencyCode)} />
        <StatCard icon={WalletCards} label="Provider payable" value={formatMoney(summary.netProviderPayableAmount, currencyCode)} />
        <StatCard icon={HandCoins} label="Staff estimated" value={formatMoney(summary.staffCompensationEstimated, currencyCode)} />
        <StatCard icon={Banknote} label="Staff paid" value={formatMoney(summary.staffCompensationPaid, currencyCode)} />
        <StatCard icon={Banknote} label="Staff outstanding" value={formatMoney(summary.staffCompensationOutstanding, currencyCode)} />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_420px]">
        <Card className="overflow-hidden">
          <CardHeader><CardTitle>Booking earnings breakdown</CardTitle></CardHeader>
          <CardContent className="overflow-x-auto p-0">
            <table className="min-w-[1180px] w-full text-sm">
              <thead className="bg-muted text-left text-xs text-muted-foreground">
                <tr>
                  <th className="p-3">Booking</th><th className="p-3">Staff</th><th className="p-3">Gross</th><th className="p-3">LSevin fee</th><th className="p-3">Provider payable</th><th className="p-3">Provider reversal</th><th className="p-3">Ledger</th><th className="p-3">Settlement</th><th className="p-3">Staff compensation</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const estimated = Number(row.estimatedStaffCompensation || 0);
                  const paid = row.staffPaymentStatus === "paid";
                  return (
                    <tr key={row.bookingId} className="border-t border-border align-top">
                      <td className="p-3"><div className="font-mono text-xs">{row.bookingId}</div><div className="mt-1 text-xs text-muted-foreground">{formatDate(row.bookingDate, locale, timeZone)}</div><div className="mt-1 flex gap-1"><Badge variant={statusVariant(row.bookingStatus)}>{row.bookingStatus}</Badge><Badge variant={statusVariant(row.paymentStatus)}>{row.paymentStatus || "payment unknown"}</Badge></div></td>
                      <td className="p-3"><div className="font-medium">{row.staffName || "Unassigned"}</div>{row.staffId ? <div className="font-mono text-[11px] text-muted-foreground">{row.staffId}</div> : null}</td>
                      <td className="p-3 font-semibold">{formatMoney(row.grossAmount, currencyCode)}</td>
                      <td className="p-3">{formatMoney(row.platformFeeAmount, currencyCode)}</td>
                      <td className="p-3 font-semibold">{formatMoney(row.netProviderPayableAmount, currencyCode)}</td>
                      <td className="p-3">{formatMoney(row.refundReversalAmount, currencyCode)}</td>
                      <td className="p-3 text-xs"><div>pending {formatMoney(row.ledgerPendingAmount, currencyCode)}</div><div>approved {formatMoney(row.ledgerApprovedAmount, currencyCode)}</div><div>paid {formatMoney(row.ledgerPaidAmount, currencyCode)}</div></td>
                      <td className="p-3 text-xs">{row.settlementNumber ? <><div className="font-medium">{row.settlementNumber}</div><Badge variant={statusVariant(row.settlementStatus)}>{row.settlementStatus || "unknown"}</Badge></> : <span className="text-muted-foreground">Not batched</span>}</td>
                      <td className="p-3">
                        {row.staffId ? (
                          <div className="space-y-2">
                            <div className="font-semibold">{formatMoney(row.estimatedStaffCompensation, currencyCode)}</div>
                            <div className="text-xs text-muted-foreground">{row.compensationMode ? `${row.compensationMode} · ${row.compensationPercent}% + ${formatMoney(row.compensationFixedAmount, currencyCode)}` : "No active rule"}</div>
                            {paid ? <Badge variant="success">Paid {formatMoney(row.staffPaymentAmount, currencyCode)}</Badge> : estimated > 0 ? (
                              <form action={markStaffBookingCompensationPaidAction} className="space-y-2">
                                <input type="hidden" name="providerId" value={providerId} />
                                <input type="hidden" name="staffId" value={row.staffId} />
                                <input type="hidden" name="bookingId" value={row.bookingId} />
                                <input type="hidden" name="currencyCode" value={currencyCode} />
                                <Input name="notes" placeholder="Payment note (optional)" />
                                <Button type="submit" size="sm">Record paid</Button>
                              </form>
                            ) : <Badge>No payable compensation</Badge>}
                          </div>
                        ) : <span className="text-muted-foreground">No staff assignment</span>}
                      </td>
                    </tr>
                  );
                })}
                {!rows.length ? <tr><td colSpan={9} className="p-6 text-center text-muted-foreground">No bookings found for this period/currency.</td></tr> : null}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <div className="space-y-5">
          <Card>
            <CardHeader><CardTitle>Staff compensation rule</CardTitle></CardHeader>
            <CardContent>
              <form action={saveStaffCompensationRuleAction} className="space-y-3">
                <input type="hidden" name="providerId" value={providerId} />
                <Field label="Staff"><LazySearchSelect name="staffId" endpoint={`/api/providers/${providerId}/finance/staff-options`} placeholder="Select staff" searchPlaceholder="Search staff" required /></Field>
                <Field label="Calculation"><Select name="calculationMode" defaultValue="percent"><option value="percent">Percent of provider payable</option><option value="fixed">Fixed per eligible booking</option><option value="hybrid">Percent + fixed</option></Select></Field>
                <div className="grid grid-cols-2 gap-3"><Field label="Percent"><Input name="percentValue" type="number" min="0" max="100" step="0.01" defaultValue="0" /></Field><Field label="Fixed amount"><Input name="fixedAmount" type="number" min="0" step="0.01" defaultValue="0" /></Field></div>
                <Field label="Currency"><CurrencySelect name="currencyCode" value={currencyCode} /></Field>
                <div className="grid grid-cols-2 gap-3"><Field label="Effective from"><LocalizedDateInput name="effectiveFrom" value={new Date().toISOString().slice(0, 10)} locale={locale} timeZone={timeZone} required /></Field><Field label="Effective to"><LocalizedDateInput name="effectiveTo" locale={locale} timeZone={timeZone} /></Field></div>
                <Field label="Notes"><Textarea name="notes" /></Field>
                <Button type="submit">Save active rule</Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Current / historical rules</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {rules.map((rule) => <div key={rule.id} className="rounded-lg border border-border p-3 text-sm"><div className="flex items-start justify-between gap-3"><div><div className="font-semibold">{rule.staffName}</div><div className="text-xs text-muted-foreground">{rule.currencyCode} · {rule.calculationMode} · {rule.percentValue}% + {formatMoney(rule.fixedAmount, rule.currencyCode)}</div><div className="text-xs text-muted-foreground">{formatDate(rule.effectiveFrom, locale, timeZone)} → {rule.effectiveTo ? formatDate(rule.effectiveTo, locale, timeZone) : "open"}</div></div><Badge variant={rule.isActive ? "success" : "neutral"}>{rule.isActive ? "Active" : "Inactive"}</Badge></div>{rule.notes ? <p className="mt-2 text-xs">{rule.notes}</p> : null}{rule.isActive ? <form action={disableStaffCompensationRuleAction} className="mt-2"><input type="hidden" name="providerId" value={providerId}/><input type="hidden" name="ruleId" value={rule.id}/><Button type="submit" size="sm" variant="ghost">Disable</Button></form> : null}</div>)}
              {!rules.length ? <p className="text-sm text-muted-foreground">No staff compensation rules yet.</p> : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
