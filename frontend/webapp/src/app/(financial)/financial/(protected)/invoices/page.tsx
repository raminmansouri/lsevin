import { PANEL_LOCALE } from "@/accounting/lib/panel-locale";
import { formatAmount } from "@/accounting/lib/format";
import { listDimensions, listPostableAccounts } from "@/accounting/server/manual-entry.queries";
import { listInvoices } from "@/accounting/server/invoices.service";
import { getBaseCurrency } from "@/accounting/server/settings.repository";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { InvoiceForm } from "./invoice-form";
import { InvoiceRowActions } from "./invoice-actions-buttons";

const STATUS_LABEL: Record<string, { text: string; className: string }> = {
  draft: { text: "پیش‌نویس", className: "bg-zinc-100 text-zinc-700" },
  issued: { text: "صادرشده", className: "bg-emerald-100 text-emerald-800" },
  cancelled: { text: "ابطال‌شده", className: "bg-red-100 text-red-800" },
};

const ENTRY_STATUS_LABEL: Record<string, string> = {
  draft: "پیش‌نویس",
  temporary: "موقت",
  approved: "تأییدشده",
  posted: "قطعی",
  reversed: "برگشت‌خورده",
  rejected: "ردشده",
};

export default async function InvoicesPage() {
  const locale = PANEL_LOCALE;
  const [accounts, dimensions, invoices, baseCurrency] = await Promise.all([
    listPostableAccounts(locale),
    listDimensions(locale),
    listInvoices({ limit: 200 }, locale),
    getBaseCurrency(),
  ]);

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="border-b">
          <CardTitle>صدور فاکتور خرید و فروش</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <p className="text-muted-foreground mb-4 text-sm">
            فاکتور به‌صورت پیش‌نویس ذخیره می‌شود. با «صدور فاکتور» یک سند حسابداری پیش‌نویس ساخته و
            به فاکتور متصل می‌شود؛ آن سند مثل هر سند دستی دیگری باید تأیید و قطعی شود. اگر نوع و
            شناسهٔ طرف حساب را پر کنید، فاکتور در صورت‌حساب همان طرف حساب هم دیده می‌شود.
          </p>
          <InvoiceForm
            accounts={accounts}
            dimensions={dimensions}
            today={today}
            baseCurrency={baseCurrency}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b">
          <CardTitle>فاکتورها</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-muted-foreground border-b text-xs">
                <tr>
                  <th className="p-2 text-start">شماره</th>
                  <th className="p-2 text-start">نوع</th>
                  <th className="p-2 text-start">تاریخ</th>
                  <th className="p-2 text-start">سررسید</th>
                  <th className="p-2 text-start">طرف حساب</th>
                  <th className="p-2 text-start">حساب طرف مقابل</th>
                  <th className="p-2 text-start">جمع</th>
                  <th className="p-2 text-start">مالیات</th>
                  <th className="p-2 text-start">مبلغ کل</th>
                  <th className="p-2 text-start">وضعیت</th>
                  <th className="p-2 text-start">سند حسابداری</th>
                  <th className="p-2 text-start">عملیات</th>
                </tr>
              </thead>
              <tbody>
                {invoices.length === 0 && (
                  <tr>
                    <td colSpan={12} className="text-muted-foreground p-6 text-center">
                      هنوز فاکتوری صادر نشده است.
                    </td>
                  </tr>
                )}
                {invoices.map((invoice) => {
                  const status = STATUS_LABEL[invoice.status] ?? {
                    text: invoice.status,
                    className: "bg-zinc-100 text-zinc-700",
                  };

                  return (
                    <tr key={invoice.id} className="border-b last:border-0">
                      <td className="p-2 font-mono" dir="ltr">
                        {invoice.invoiceNumber}
                      </td>
                      <td className="p-2 text-xs">
                        {invoice.kind === "sale" ? "فروش" : "خرید"}
                      </td>
                      <td className="p-2" dir="ltr">
                        {invoice.invoiceDate}
                      </td>
                      <td className="p-2" dir="ltr">
                        {invoice.dueDate ?? "—"}
                      </td>
                      <td className="p-2">
                        {invoice.partyName}
                        {invoice.referenceNumber && (
                          <span className="text-muted-foreground block text-xs" dir="ltr">
                            {invoice.referenceNumber}
                          </span>
                        )}
                      </td>
                      <td className="p-2 text-xs">
                        <span className="font-mono" dir="ltr">
                          {invoice.counterpartyAccountCode}
                        </span>{" "}
                        {invoice.counterpartyAccountName}
                      </td>
                      <td className="p-2" dir="ltr">
                        {formatAmount(invoice.subtotalAmount, invoice.currencyCode)}
                      </td>
                      <td className="p-2" dir="ltr">
                        {formatAmount(invoice.taxAmount, invoice.currencyCode)}
                      </td>
                      <td className="p-2 font-medium" dir="ltr">
                        {formatAmount(invoice.totalAmount, invoice.currencyCode)}
                      </td>
                      <td className="p-2">
                        <span className={`rounded-full px-2 py-0.5 text-xs ${status.className}`}>
                          {status.text}
                        </span>
                      </td>
                      <td className="p-2 text-xs">
                        {invoice.journalEntryNumber ? (
                          <>
                            <span className="font-mono" dir="ltr">
                              #{invoice.journalEntryNumber}
                            </span>
                            <span className="text-muted-foreground block">
                              {ENTRY_STATUS_LABEL[invoice.journalEntryStatus ?? ""] ??
                                invoice.journalEntryStatus}
                            </span>
                          </>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="p-2">
                        <InvoiceRowActions invoiceId={invoice.id} status={invoice.status} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
