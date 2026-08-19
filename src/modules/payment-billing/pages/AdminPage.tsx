import { Badge } from "@core/ui/Badge";
import { Button } from "@core/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@core/ui/Card";
import { Input, Select, Textarea, Field } from "@core/ui/Field";
import { PageHeader } from "@core/ui/PageHeader";
import { CurrencySelect } from "@core/ui/CurrencySelect";
import { LocaleSelect } from "@core/ui/LocaleSelect";
import { LocalizedDateInput } from "@core/ui/LocalizedDateInput";
import { getPortalLocale } from "@core/i18n/server";
import { formatMoney } from "@core/lib/format";
import { createPaymentIntentAction, issueDirectInvoiceAction, uploadReceiptAction, verifyReceiptAction } from "../actions";
import { getModuleSummary, listInvoices, listPaymentMethods } from "../repository";

function statusVariant(status: string) {
  if (["paid", "succeeded", "verified"].includes(status)) return "success" as const;
  if (["cancelled", "void", "failed", "rejected"].includes(status)) return "danger" as const;
  return "warning" as const;
}

export async function AdminPage() {
  const [summary, invoices, methods, locale] = await Promise.all([getModuleSummary(), listInvoices(undefined, 100), listPaymentMethods(), getPortalLocale()]);
  const firstOpenInvoice = invoices.find((invoice) => invoice.status !== "paid");

  return (
    <div className="space-y-6">
      <PageHeader title="Payment & Billing Control" description="Central payment module used by Provider Portal, Pricing Plans, Finance/Settlements, Bookings, and any future module through Core ModuleBus capabilities." />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card><CardContent><div className="text-sm font-bold text-slate-950">Issued invoices</div><p className="mt-1 text-2xl font-bold">{summary.issuedCount}</p></CardContent></Card>
        <Card><CardContent><div className="text-sm font-bold text-slate-950">Open invoices</div><p className="mt-1 text-2xl font-bold">{summary.openCount}</p></CardContent></Card>
        <Card><CardContent><div className="text-sm font-bold text-slate-950">Paid invoices</div><p className="mt-1 text-2xl font-bold">{summary.paidCount}</p></CardContent></Card>
        <Card><CardContent><div className="text-sm font-bold text-slate-950">Outstanding</div><p className="mt-1 text-2xl font-bold">{formatMoney(summary.outstandingAmount, summary.currencyCode)}</p></CardContent></Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.4fr_0.6fr]">
        <Card>
          <CardHeader><CardTitle>Invoices issued by integrated modules</CardTitle></CardHeader>
          <CardContent>
            {invoices.length ? (
              <div className="overflow-hidden rounded-lg border border-border">
                <table className="w-full text-sm">
                  <thead className="bg-muted text-left text-xs uppercase text-muted-foreground"><tr><th className="p-3">Invoice</th><th className="p-3">Bill to</th><th className="p-3">Source module</th><th className="p-3">Status</th><th className="p-3">Total</th></tr></thead>
                  <tbody>
                    {invoices.map((invoice) => (
                      <tr key={invoice.id} className="border-t border-border">
                        <td className="p-3"><div className="font-bold">{invoice.invoiceNumber}</div><div className="font-mono text-xs text-muted-foreground">{invoice.id}</div></td>
                        <td className="p-3"><div>{invoice.billToEntityType}</div><div className="font-mono text-xs text-muted-foreground">{invoice.billToEntityId}</div></td>
                        <td className="p-3"><div>{invoice.sourceModule ?? "payment-billing"}</div><div className="text-xs text-muted-foreground">{invoice.sourceEntityType ?? "direct"}</div></td>
                        <td className="p-3"><Badge variant={statusVariant(invoice.status)}>{invoice.status}</Badge></td>
                        <td className="p-3 font-bold">{formatMoney(invoice.totalAmount, invoice.currencyCode)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <p className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">No invoices yet. Integrated modules will issue payment obligations here.</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Issue invoice / payment operations</CardTitle></CardHeader>
          <CardContent className="space-y-5">
            <form action={issueDirectInvoiceAction} className="space-y-3">
              <Field label="Invoice capability"><Select name="capability" defaultValue="billing.issue_invoice"><option value="billing.issue_invoice">Standard invoice</option><option value="billing.issue_tax_invoice">Iran tax invoice</option><option value="billing.issue_proforma">International proforma</option></Select></Field>
              <Field label="Invoice type"><Select name="invoiceType" defaultValue="standard"><option value="standard">Standard</option><option value="tax_ir">Iran tax</option><option value="proforma">Proforma</option><option value="international">International</option></Select></Field>
              <Field label="Bill-to entity type"><Select name="billToEntityType" defaultValue="provider"><option value="provider">Provider</option><option value="staff">Staff</option><option value="customer">Customer</option><option value="company">Company</option></Select></Field>
              <Field label="Bill-to entity ID"><Input name="billToEntityId" placeholder="uuid" required /></Field>
              <Field label="Display name"><Input name="billToDisplayName" /></Field>
              <Field label="Title"><Input name="title" defaultValue="LSevin invoice" /></Field>
              <Field label="Line description"><Input name="description" defaultValue="LSevin provider portal fee" /></Field>
              <Field label="Quantity"><Input name="quantity" type="number" step="0.01" defaultValue="1" /></Field>
              <Field label="Unit amount"><Input name="unitAmount" type="number" step="0.01" defaultValue="0" /></Field>
              <Field label="Tax percent"><Input name="taxPercent" type="number" step="0.01" defaultValue="0" /></Field>
              <Field label="Currency"><CurrencySelect name="currencyCode" value="IRR" /></Field>
              <Field label="Locale"><LocaleSelect name="locale" value="fa-IR" /></Field>
              <Field label="Due date"><LocalizedDateInput name="dueDate" locale={locale.header} /></Field>
              <Button type="submit" className="w-full">Issue invoice</Button>
            </form>
            <form action={createPaymentIntentAction} className="space-y-3">
              <Field label="Invoice"><Select name="invoiceId" defaultValue={firstOpenInvoice?.id ?? ""} required>{invoices.filter((invoice) => !["paid", "cancelled", "void"].includes(invoice.status)).map((invoice) => <option key={invoice.id} value={invoice.id}>{invoice.invoiceNumber} · {formatMoney(Number(invoice.totalAmount) - Number(invoice.paidAmount), invoice.currencyCode)}</option>)}</Select></Field>
              <Field label="Payment gateway"><Select name="methodCode" defaultValue="zarinpal">{methods.filter((method) => method.isEnabled && method.methodKind === "gateway").map((method) => <option key={method.code} value={method.code}>{method.title}</option>)}</Select></Field>
              <p className="text-xs text-muted-foreground">Amount and currency are bound to the invoice outstanding balance.</p>
              <Button type="submit" className="w-full">Create payment intent</Button>
            </form>

            <form action={uploadReceiptAction} className="space-y-3 border-t border-border pt-5">
              <Field label="Invoice"><Select name="invoiceId" defaultValue={firstOpenInvoice?.id ?? ""} required>{invoices.filter((invoice) => !["paid", "cancelled", "void"].includes(invoice.status)).map((invoice) => <option key={invoice.id} value={invoice.id}>{invoice.invoiceNumber} · {formatMoney(Number(invoice.totalAmount) - Number(invoice.paidAmount), invoice.currencyCode)}</option>)}</Select></Field>
              <Field label="Manual method"><Select name="methodCode" defaultValue="card_to_card">{methods.filter((method) => method.isEnabled && ["manual", "international"].includes(method.methodKind)).map((method) => <option key={method.code} value={method.code}>{method.title}</option>)}</Select></Field>
              <p className="text-xs text-muted-foreground">Receipt amount and currency are bound to the selected invoice.</p>
              <Field label="Tracking number"><Input name="trackingNumber" /></Field>
              <Field label="Receipt file"><Input name="receiptFile" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" required /></Field>
              <Field label="Note"><Textarea name="payerNote" /></Field>
              <Button type="submit" variant="secondary" className="w-full">Upload receipt</Button>
            </form>

            <form action={verifyReceiptAction} className="space-y-3 border-t border-border pt-5">
              <Field label="Receipt ID"><Input name="receiptId" placeholder="payment_receipts.id" /></Field>
              <Field label="Decision"><Select name="approved" defaultValue="true"><option value="true">Verify receipt</option><option value="false">Reject receipt</option></Select></Field>
              <Field label="Review note"><Textarea name="note" /></Field>
              <Button type="submit" variant="secondary" className="w-full">Apply receipt decision</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
