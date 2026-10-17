import { getTranslations } from "next-intl/server";

import { PANEL_LOCALE } from "@/accounting/lib/panel-locale";

import { formatDateTime, formatForDisplay } from "@/accounting/lib/format";
import { listPendingDeposits } from "@/accounting/server/admin-queries";
import {
  listBookingPaymentsForReview,
  listPartlyPaidBookings,
  listRecentBookingPayments,
  type BookingPaymentKind,
} from "@/accounting/server/booking-payments.queries";
import { ExportButtons } from "@/accounting/components/export-buttons";
import { PageHeader } from "@/components/page/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { approveDepositAction, rejectDepositAction } from "../actions";
import { BookingPaymentReviewForms, RecordBookingBalanceForm } from "./booking-payment-forms";

const RECENT_DAYS = 30;

type Translator = Awaited<ReturnType<typeof getTranslations<"Admin.accounting">>>;

const KIND_STYLE: Record<BookingPaymentKind, { badge: string; card: string; bar: string }> = {
  full: { badge: "bg-green-600 text-white", card: "", bar: "bg-green-600" },
  deposit: { badge: "bg-teal-600 text-white", card: "border-teal-300 bg-teal-50/60", bar: "bg-teal-600" },
  partial: { badge: "bg-orange-500 text-white", card: "border-orange-300 bg-orange-50/60", bar: "bg-orange-500" },
};

const KNOWN_METHODS = new Set([
  "bank_receipt",
  "pay_on_delivery",
  "cash_on_delivery",
  "manual_card",
  "wallet",
  "manual_collection",
]);

function methodLabel(t: Translator, method: string, gateway?: string | null): string {
  if (KNOWN_METHODS.has(method)) return t(`bookingMethod.${method}` as never);
  return gateway ? `${t("bookingMethod.online")} (${gateway})` : t("bookingMethod.online");
}

/** A bare calendar date (booking.selected_date), shown without a time or a timezone shift. */
function formatDate(value: string): string {
  try {
    return new Intl.DateTimeFormat("fa-IR", { dateStyle: "medium", timeZone: "UTC" }).format(
      new Date(`${value.slice(0, 10)}T00:00:00Z`)
    );
  } catch {
    return value;
  }
}

function money(amount: string, currencyCode: string) {
  const { value, unit } = formatForDisplay(amount, currencyCode, PANEL_LOCALE);
  return (
    <>
      {value} <span className="text-muted-foreground text-xs">{unit}</span>
    </>
  );
}

function KindBadge({ t, kind }: { t: Translator; kind: BookingPaymentKind }) {
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${KIND_STYLE[kind].badge}`}>
      {t(`bookingKind.${kind}` as never)}
    </span>
  );
}

/** Paid / left to pay, the same split the customer sees on their booking. */
function PaidSplit({
  t,
  kind,
  totalAmount,
  paidAmount,
  remainingAmount,
  currencyCode,
}: {
  t: Translator;
  kind: BookingPaymentKind;
  totalAmount: string;
  paidAmount: string;
  remainingAmount: string;
  currencyCode: string;
}) {
  const total = Number(totalAmount);
  const percent = total > 0 ? Math.min(100, Math.max(0, Math.round((Number(paidAmount) / total) * 100))) : 0;
  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
        <span>
          {t("bookingTotal")}: <span className="font-semibold">{money(totalAmount, currencyCode)}</span>
        </span>
        <span className="text-green-800">
          {t("bookingPaid")}: <span className="font-semibold">{money(paidAmount, currencyCode)}</span>
        </span>
        <span className="text-amber-800">
          {t("bookingRemaining")}: <span className="font-semibold">{money(remainingAmount, currencyCode)}</span>
        </span>
      </div>
      <div className="h-2 w-full max-w-md overflow-hidden rounded-full bg-gray-200" aria-hidden>
        <div className={`h-full ${KIND_STYLE[kind].bar}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function BookingHeading({
  t,
  serviceName,
  providerName,
  customerName,
  customerEmail,
  confirmationCode,
  selectedDate,
}: {
  t: Translator;
  serviceName: string;
  providerName: string;
  customerName: string | null;
  customerEmail: string | null;
  confirmationCode: string | null;
  selectedDate: string | null;
}) {
  return (
    <div className="space-y-0.5">
      <div className="font-medium">
        {serviceName} · <span className="text-muted-foreground">{providerName}</span>
      </div>
      <div>{customerName || "-"}</div>
      {customerEmail && (
        <div className="text-muted-foreground text-xs">
          <span dir="ltr">{customerEmail}</span>
        </div>
      )}
      <div className="text-muted-foreground text-xs">
        {confirmationCode && (
          <>
            {t("bookingCode")}: <span dir="ltr" className="font-mono">{confirmationCode}</span>
          </>
        )}
        {selectedDate && (
          <span className="ms-3">
            {t("bookingDate")}: {formatDate(selectedDate)}
          </span>
        )}
      </div>
    </div>
  );
}

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <div>
        <h3 className="text-base font-semibold">{title}</h3>
        {description && <p className="text-muted-foreground text-xs">{description}</p>}
      </div>
      {children}
    </section>
  );
}

export default async function DepositQueuePage() {
  const locale = PANEL_LOCALE;
  const t = await getTranslations("Admin.accounting");
  const [toReview, partlyPaid, recent, deposits] = await Promise.all([
    listBookingPaymentsForReview(),
    listPartlyPaidBookings(),
    listRecentBookingPayments(RECENT_DAYS),
    listPendingDeposits(),
  ]);

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>
          <PageHeader title={t("depositQueueTitle")}>
            <ExportButtons report="deposits" locale={locale} />
          </PageHeader>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-8 pt-4">
        {/* 1. Receipts and pay-at-place payments: nothing is counted as paid until approved. */}
        <Section title={t("bookingReviewTitle")} description={t("bookingReviewDescription")}>
          {toReview.length === 0 && <p className="text-muted-foreground text-sm">{t("queueEmpty")}</p>}
          {toReview.map((row) => (
            <div
              key={row.paymentId}
              className={`rounded-md border p-4 text-sm ${Number(row.paidAmount) > 0 ? KIND_STYLE[row.kind].card : ""}`}
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-1">
                  <BookingHeading t={t} {...row} />
                  <div className="text-muted-foreground text-xs">
                    {methodLabel(t, row.method)} · {formatDateTime(row.createdAt, locale)}
                  </div>
                  <div className="text-base font-semibold">
                    {t("claimedAmount")}: {money(row.amount, row.paymentCurrencyCode)}
                  </div>
                  {Number(row.paidAmount) > 0 && (
                    <>
                      <KindBadge t={t} kind={row.kind} />
                      <PaidSplit t={t} {...row} />
                    </>
                  )}
                  {row.receiptUrl && (
                    <a href={row.receiptUrl} target="_blank" rel="noreferrer" className="inline-block pt-1">
                      {row.receiptMimeType && !row.receiptMimeType.startsWith("image/") ? (
                        <span className="text-primary text-sm font-medium underline">{t("receipt")}</span>
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={row.receiptUrl} alt={t("receipt")} className="h-28 w-auto rounded-md border object-cover" />
                      )}
                    </a>
                  )}
                </div>
                <BookingPaymentReviewForms bookingId={row.bookingId} paymentId={row.paymentId} />
              </div>
            </div>
          ))}
        </Section>

        {/* 2. Money is in, but not all of it. Stays here until the rest is recorded. */}
        <Section title={t("partlyPaidTitle")} description={t("partlyPaidDescription")}>
          {partlyPaid.length === 0 && <p className="text-muted-foreground text-sm">{t("queueEmpty")}</p>}
          {partlyPaid.map((row) => (
            <div key={row.bookingId} className={`rounded-md border p-4 text-sm ${KIND_STYLE[row.kind].card}`}>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-1">
                  <KindBadge t={t} kind={row.kind} />
                  <BookingHeading t={t} {...row} />
                  {row.lastPaymentAt && (
                    <div className="text-muted-foreground text-xs">
                      {t("lastPayment")}: {formatDateTime(row.lastPaymentAt, locale)}
                    </div>
                  )}
                  <PaidSplit t={t} {...row} />
                  {row.hasPendingReview && (
                    <p className="text-xs font-medium text-amber-800">{t("partlyPaidHasPendingReview")}</p>
                  )}
                </div>
                <RecordBookingBalanceForm
                  bookingId={row.bookingId}
                  remainingAmount={row.remainingAmount}
                  currencyCode={row.currencyCode}
                />
              </div>
            </div>
          ))}
        </Section>

        {/* 3. What came in recently, for the record. Read-only. */}
        <Section title={t("recentBookingPaymentsTitle", { days: RECENT_DAYS })}>
          {recent.length === 0 ? (
            <p className="text-muted-foreground text-sm">{t("queueEmpty")}</p>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-xs">
                  <tr>
                    <th className="p-2 text-start">{t("paidAt")}</th>
                    <th className="p-2 text-start">{t("customer")}</th>
                    <th className="p-2 text-start">{t("service")}</th>
                    <th className="p-2 text-start">{t("paymentMethodLabel")}</th>
                    <th className="p-2 text-start">{t("amount")}</th>
                    <th className="p-2 text-start">{t("bookingStatusLabel")}</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((row) => (
                    <tr key={row.paymentId} className="border-t align-top">
                      <td className="p-2 whitespace-nowrap">{formatDateTime(row.paidAt, locale)}</td>
                      <td className="p-2">{row.customerName || row.customerEmail || "-"}</td>
                      <td className="p-2">
                        {row.serviceName}
                        <div className="text-muted-foreground text-xs">{row.providerName}</div>
                      </td>
                      <td className="p-2">
                        {methodLabel(t, row.method, row.gateway)}
                        {row.externalReference && (
                          <div className="text-muted-foreground font-mono text-xs" dir="ltr">
                            {row.externalReference}
                          </div>
                        )}
                      </td>
                      <td className="p-2 whitespace-nowrap">{money(row.amount, row.paymentCurrencyCode)}</td>
                      <td className="p-2">
                        <KindBadge t={t} kind={row.kind} />
                        {row.kind !== "full" && (
                          <div className="text-xs text-amber-800">
                            {t("bookingRemaining")}: {money(row.remainingAmount, row.currencyCode)}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Section>

        {/* 4. Wallet top-ups (accounting.deposit_requests). */}
        <Section title={t("walletDepositsTitle")} description={t("depositQueueDescription")}>
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
                      <a href={deposit.receiptUrl} target="_blank" rel="noreferrer" className="inline-block pt-1">
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
        </Section>
      </CardContent>
    </Card>
  );
}
