import { getTranslations } from "next-intl/server";

import { formatDateTime, formatForDisplay } from "@/accounting/lib/format";
import { listPendingDeposits } from "@/accounting/server/admin-queries";
import { ExportButtons } from "@/accounting/components/export-buttons";
import { PageHeader } from "@/components/page/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LocalePageProps } from "@/types/next";

import { approveDepositAction, rejectDepositAction } from "../actions";

export default async function DepositQueuePage({ params }: LocalePageProps) {
  const { locale } = await params;
  const t = await getTranslations("Admin.accounting");
  const deposits = await listPendingDeposits();

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>
          <PageHeader title={t("depositQueueTitle")}>
              <ExportButtons report="deposits" locale={locale} />
            </PageHeader>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-4">
        <p className="text-muted-foreground text-sm">{t("depositQueueDescription")}</p>

        {deposits.length === 0 && <p className="text-muted-foreground text-sm">{t("queueEmpty")}</p>}

        {deposits.map((deposit) => {
          const claimed = formatForDisplay(deposit.amount, deposit.currencyCode, locale);
          return (
            <div key={deposit.id} className="rounded-md border p-4 text-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-1">
                  <div className="font-medium">{deposit.customerName || deposit.userId}</div>
                  {deposit.customerEmail && (
                    <div className="text-muted-foreground" dir="ltr">
                      {deposit.customerEmail}
                    </div>
                  )}
                  <div className="text-muted-foreground">
                    {t(`method.${deposit.method}` as never)} · {formatDateTime(deposit.createdAt, locale)}
                  </div>
                  <div className="text-base font-semibold">
                    {claimed.value} <span className="text-muted-foreground text-sm">{claimed.unit}</span>
                  </div>
                  {deposit.externalReference && (
                    <div className="text-muted-foreground text-xs">
                      {t("reference")}: <span dir="ltr" className="font-mono">{deposit.externalReference}</span>
                    </div>
                  )}
                  {deposit.receiptUrl && (
                    <a
                      href={deposit.receiptUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-block pt-1"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={deposit.receiptUrl}
                        alt={t("receipt")}
                        className="h-28 w-auto rounded-md border object-cover"
                      />
                    </a>
                  )}
                </div>

                <div className="grid gap-2 sm:min-w-[440px] sm:grid-cols-2">
                  <form
                    action={approveDepositAction}
                    className="rounded-md border border-green-200 bg-green-50 p-3 dark:bg-green-950/20"
                  >
                    <input type="hidden" name="depositRequestId" value={deposit.id} />
                    <label className="text-xs font-medium text-green-900 dark:text-green-200">
                      {t("confirmedAmount")}
                    </label>
                    {/* Pre-filled with the claim, but the admin confirms what the receipt
                        actually shows — that figure is what gets credited. */}
                    <input
                      name="confirmedAmount"
                      type="text"
                      inputMode="decimal"
                      dir="ltr"
                      defaultValue={deposit.amount.split(".")[0]}
                      className="mt-1 h-9 w-full rounded border px-2"
                    />
                    <p className="text-muted-foreground mt-1 text-[11px]">
                      {t("rawUnitHint", { currency: deposit.currencyCode })}
                    </p>
                    <button className="mt-2 w-full rounded bg-green-700 px-3 py-2 text-xs font-semibold text-white">
                      {t("approveDeposit")}
                    </button>
                  </form>

                  <form
                    action={rejectDepositAction}
                    className="rounded-md border border-red-200 bg-red-50 p-3 dark:bg-red-950/20"
                  >
                    <input type="hidden" name="depositRequestId" value={deposit.id} />
                    <label className="text-xs font-medium text-red-900 dark:text-red-200">
                      {t("rejectReason")}
                    </label>
                    <input
                      name="reason"
                      type="text"
                      defaultValue={t("defaultDepositRejectReason")}
                      className="mt-1 h-9 w-full rounded border px-2"
                    />
                    <button className="mt-2 w-full rounded bg-red-700 px-3 py-2 text-xs font-semibold text-white">
                      {t("reject")}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
