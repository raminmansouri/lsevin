import { Badge } from "@core/ui/Badge";
import { Button } from "@core/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@core/ui/Card";
import { Input, Select, Textarea, Field } from "@core/ui/Field";
import { PageHeader } from "@core/ui/PageHeader";
import { formatDate, formatMoney } from "@core/lib/format";
import { getPortalLocale } from "@core/i18n/server";
import { getProviderTimeZone } from "@core/providers/timezone";
import { createPaymentIntentAction, uploadReceiptAction } from "../actions";
import { getModuleSummary, listInvoices, listPaymentMethods } from "../repository";

function statusVariant(status: string) {
  if (["paid", "succeeded", "verified"].includes(status)) return "success" as const;
  if (["cancelled", "void", "failed", "rejected"].includes(status)) return "danger" as const;
  return "warning" as const;
}

export async function ProviderPage({ params }: { params: Record<string, string> }) {
  const providerId = params.providerId;
  const [summary, invoices, methods, locale, timeZone] = await Promise.all([getModuleSummary(providerId), listInvoices(providerId), listPaymentMethods(), getPortalLocale(), getProviderTimeZone(providerId)]);
  const firstOpenInvoice = invoices.find((invoice) => invoice.status !== "paid");

  return (
    <div className="space-y-6">
      <PageHeader title="Provider Billing" description="Standalone PaymentBilling integration for provider profile ownership, pricing plans, invoices, gateway intents, manual receipt upload, and bank reconciliation." />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card><CardContent><div className="text-sm font-bold text-slate-950">Issued invoices</div><p className="mt-1 text-2xl font-bold">{summary.issuedCount}</p></CardContent></Card>
        <Card><CardContent><div className="text-sm font-bold text-slate-950">Open invoices</div><p className="mt-1 text-2xl font-bold">{summary.openCount}</p></CardContent></Card>
        <Card><CardContent><div className="text-sm font-bold text-slate-950">Paid invoices</div><p className="mt-1 text-2xl font-bold">{summary.paidCount}</p></CardContent></Card>
        <Card><CardContent><div className="text-sm font-bold text-slate-950">Outstanding</div><p className="mt-1 text-2xl font-bold">{formatMoney(summary.outstandingAmount, summary.currencyCode)}</p></CardContent></Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.4fr_0.6fr]">
        <Card>
          <CardHeader><CardTitle>Provider invoices from all payment-required modules</CardTitle></CardHeader>
          <CardContent>
            {invoices.length ? (
              <div className="overflow-hidden rounded-lg border border-border">
                <table className="w-full text-sm">
                  <thead className="bg-muted text-left text-xs uppercase text-muted-foreground"><tr><th className="p-3">Invoice</th><th className="p-3">Source</th><th className="p-3">Status</th><th className="p-3">Total</th><th className="p-3">Due</th></tr></thead>
                  <tbody>
                    {invoices.map((invoice) => (
                      <tr key={invoice.id} className="border-t border-border">
                        <td className="p-3"><div className="font-bold">{invoice.invoiceNumber}</div><div className="text-xs text-muted-foreground">{invoice.invoiceType}</div></td>
                        <td className="p-3"><div>{invoice.sourceModule ?? "payment-billing"}</div><div className="text-xs text-muted-foreground">{invoice.sourceEntityType ?? invoice.billToEntityType}</div></td>
                        <td className="p-3"><Badge variant={statusVariant(invoice.status)}>{invoice.status}</Badge></td>
                        <td className="p-3 font-bold">{formatMoney(invoice.totalAmount, invoice.currencyCode)}</td>
                        <td className="p-3 text-xs text-muted-foreground">{formatDate(invoice.dueDate, locale.header, timeZone)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <p className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">No invoices yet. Profile claims, paid plan assignments, settlements, and other modules will issue invoices here through Core ModuleBus.</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Pay or upload receipt</CardTitle></CardHeader>
          <CardContent className="space-y-5">
            <form action={createPaymentIntentAction} className="space-y-3">
              <input type="hidden" name="providerId" value={providerId} />
              <Field label="Invoice"><Select name="invoiceId" defaultValue={firstOpenInvoice?.id ?? ""} required>{invoices.filter((invoice) => !["paid", "cancelled", "void"].includes(invoice.status)).map((invoice) => <option key={invoice.id} value={invoice.id}>{invoice.invoiceNumber} · {formatMoney(Number(invoice.totalAmount) - Number(invoice.paidAmount), invoice.currencyCode)}</option>)}</Select></Field>
              <Field label="Payment gateway"><Select name="methodCode" defaultValue="zarinpal">{methods.filter((method) => method.isEnabled && method.methodKind === "gateway").map((method) => <option key={method.code} value={method.code}>{method.title}</option>)}</Select></Field>
              <p className="text-xs text-muted-foreground">The server charges the selected invoice&apos;s exact outstanding amount and currency.</p>
              <Button type="submit" className="w-full">Create payment intent</Button>
            </form>

            <form action={uploadReceiptAction} className="space-y-3 border-t border-border pt-5">
              <input type="hidden" name="providerId" value={providerId} />
              <Field label="Invoice"><Select name="invoiceId" defaultValue={firstOpenInvoice?.id ?? ""} required>{invoices.filter((invoice) => !["paid", "cancelled", "void"].includes(invoice.status)).map((invoice) => <option key={invoice.id} value={invoice.id}>{invoice.invoiceNumber} · {formatMoney(Number(invoice.totalAmount) - Number(invoice.paidAmount), invoice.currencyCode)}</option>)}</Select></Field>
              <Field label="Manual method"><Select name="methodCode" defaultValue="card_to_card">{methods.filter((method) => method.isEnabled && ["manual", "international"].includes(method.methodKind)).map((method) => <option key={method.code} value={method.code}>{method.title}</option>)}</Select></Field>
              <p className="text-xs text-muted-foreground">Receipt amount and currency are taken from the invoice and cannot be edited.</p>
              <Field label="Tracking number"><Input name="trackingNumber" /></Field>
              <Field label="Receipt file"><Input name="receiptFile" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" required /></Field>
              <Field label="Note"><Textarea name="payerNote" /></Field>
              <Button type="submit" variant="secondary" className="w-full">Upload receipt</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
