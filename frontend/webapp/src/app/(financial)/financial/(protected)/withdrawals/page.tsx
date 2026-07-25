import { getTranslations } from "next-intl/server";

import { PANEL_LOCALE } from "@/accounting/lib/panel-locale";

import { formatDateTime, formatForDisplay } from "@/accounting/lib/format";
import { listPendingWithdrawals } from "@/accounting/server/admin-queries";
import { ExportButtons } from "@/accounting/components/export-buttons";
import { PageHeader } from "@/components/page/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import {
  approveWithdrawalAction,
  failWithdrawalAction,
  markWithdrawalPaidAction,
  rejectWithdrawalAction,
} from "../actions";

export default async function WithdrawalQueuePage() {
  const locale = PANEL_LOCALE;
  const t = await getTranslations("Admin.accounting");
  const withdrawals = await listPendingWithdrawals();

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>
          <PageHeader title={t("withdrawalQueueTitle")}>
              <ExportButtons report="withdrawals" locale={locale} />
            </PageHeader>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-4">
        <p className="text-muted-foreground text-sm">{t("withdrawalQueueDescription")}</p>

        {withdrawals.length === 0 && (
          <p className="text-muted-foreground text-sm">{t("queueEmpty")}</p>
        )}

        {withdrawals.map((w) => {
          const gross = formatForDisplay(w.amount, w.currencyCode, locale);
          const fee = formatForDisplay(w.feeAmount, w.currencyCode, locale);
          const net = formatForDisplay(w.netAmount, w.currencyCode, locale);
          const isPending = w.status === "pending";
          const isApproved = w.status === "approved" || w.status === "processing";

          return (
            <div key={w.id} className="rounded-md border p-4 text-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-1">
                  <div className="font-medium">{w.customerName || w.userId}</div>
                  {w.customerEmail && (
                    <div className="text-muted-foreground" dir="ltr">
                      {w.customerEmail}
                    </div>
                  )}
                  <div className="text-muted-foreground">
                    {t(`status.${w.status}` as never)} · {formatDateTime(w.createdAt, locale)}
                  </div>

                  <div className="text-base font-semibold">
                    {net.value} <span className="text-muted-foreground text-sm">{net.unit}</span>
                  </div>
                  {/* Gross and fee shown next to the net so nobody pays out the wrong figure. */}
                  <div className="text-muted-foreground text-xs">
                    {t("grossAmount")}: {gross.value} {gross.unit} · {t("feeAmount")}: {fee.value} {fee.unit}
                  </div>

                  <div className="pt-1 text-xs">
                    {w.destinationType === "bank_iban" ? (
                      <>
                        <div className="font-medium">{t("destinationBank")}</div>
                        <div dir="ltr" className="font-mono break-all">
                          {w.destinationIban}
                        </div>
                        {w.destinationHolderName && <div>{w.destinationHolderName}</div>}
                      </>
                    ) : (
                      <>
                        <div className="font-medium">
                          {t("destinationCrypto")} · {w.destinationNetwork}
                        </div>
                        <div dir="ltr" className="font-mono break-all">
                          {w.destinationAddress}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="grid gap-2 sm:min-w-[440px] sm:grid-cols-2">
                  {isPending && (
                    <>
                      <form
                        action={approveWithdrawalAction}
                        className="rounded-md border border-green-200 bg-green-50 p-3 dark:bg-green-950/20"
                      >
                        <input type="hidden" name="withdrawalRequestId" value={w.id} />
                        <label className="text-xs font-medium text-green-900 dark:text-green-200">
                          {t("approveNote")}
                        </label>
                        <input name="note" type="text" className="mt-1 h-9 w-full rounded border px-2" />
                        <button className="mt-2 w-full rounded bg-green-700 px-3 py-2 text-xs font-semibold text-white">
                          {t("approveWithdrawal")}
                        </button>
                      </form>

                      <form
                        action={rejectWithdrawalAction}
                        className="rounded-md border border-red-200 bg-red-50 p-3 dark:bg-red-950/20"
                      >
                        <input type="hidden" name="withdrawalRequestId" value={w.id} />
                        <label className="text-xs font-medium text-red-900 dark:text-red-200">
                          {t("rejectReason")}
                        </label>
                        <input
                          name="reason"
                          type="text"
                          defaultValue={t("defaultWithdrawalRejectReason")}
                          className="mt-1 h-9 w-full rounded border px-2"
                        />
                        <button className="mt-2 w-full rounded bg-red-700 px-3 py-2 text-xs font-semibold text-white">
                          {t("rejectWithdrawal")}
                        </button>
                      </form>
                    </>
                  )}

                  {isApproved && (
                    <>
                      <form
                        action={markWithdrawalPaidAction}
                        className="rounded-md border border-blue-200 bg-blue-50 p-3 dark:bg-blue-950/20"
                      >
                        <input type="hidden" name="withdrawalRequestId" value={w.id} />
                        <label className="text-xs font-medium text-blue-900 dark:text-blue-200">
                          {t("payoutReference")}
                        </label>
                        <input
                          name="payoutReference"
                          type="text"
                          dir="ltr"
                          required
                          className="mt-1 h-9 w-full rounded border px-2"
                        />
                        <button className="mt-2 w-full rounded bg-blue-700 px-3 py-2 text-xs font-semibold text-white">
                          {t("markPaid")}
                        </button>
                      </form>

                      <form
                        action={failWithdrawalAction}
                        className="rounded-md border border-amber-200 bg-amber-50 p-3 dark:bg-amber-950/20"
                      >
                        <input type="hidden" name="withdrawalRequestId" value={w.id} />
                        <label className="text-xs font-medium text-amber-900 dark:text-amber-200">
                          {t("failReason")}
                        </label>
                        <input
                          name="reason"
                          type="text"
                          defaultValue={t("defaultWithdrawalFailReason")}
                          className="mt-1 h-9 w-full rounded border px-2"
                        />
                        <button className="mt-2 w-full rounded bg-amber-700 px-3 py-2 text-xs font-semibold text-white">
                          {t("markFailed")}
                        </button>
                      </form>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
