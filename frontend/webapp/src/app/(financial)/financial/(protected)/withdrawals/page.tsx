import { getTranslations } from "next-intl/server";

import { PANEL_LOCALE } from "@/accounting/lib/panel-locale";

import { formatDateTime, formatForDisplay } from "@/accounting/lib/format";
import { listPendingWithdrawals } from "@/accounting/server/admin-queries";
import {
  listProviderPayoutsDue,
  listRecentProviderPayouts,
  type ProviderPayoutEntry,
  type ProviderPayoutGroup,
} from "@/accounting/server/provider-payouts.queries";
import { ExportButtons } from "@/accounting/components/export-buttons";
import { PageHeader } from "@/components/page/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import {
  approveWithdrawalAction,
  failWithdrawalAction,
  markWithdrawalPaidAction,
  rejectWithdrawalAction,
} from "../actions";
import { ApproveEntriesButton, CancelEntryForm, MarkProviderPaidForm } from "./provider-payout-forms";

const RECENT_DAYS = 30;

type Translator = Awaited<ReturnType<typeof getTranslations<"Admin.accounting">>>;

const STATUS_STYLE: Record<ProviderPayoutEntry["status"], string> = {
  pending: "bg-amber-100 text-amber-900",
  approved: "bg-blue-100 text-blue-900",
  paid: "bg-green-100 text-green-900",
  cancelled: "bg-gray-100 text-gray-700",
};

const CUSTOMER_PAYMENT_STYLE: Record<NonNullable<ProviderPayoutEntry["customerPayment"]>, string> = {
  full: "text-green-800",
  deposit: "text-teal-800",
  partial: "text-orange-700",
  unpaid: "text-red-700",
};

function money(amount: string, currencyCode: string): string {
  const { value, unit } = formatForDisplay(amount, currencyCode, PANEL_LOCALE);
  return `${value} ${unit}`;
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

function ProviderHeading({ t, group }: { t: Translator; group: ProviderPayoutGroup }) {
  return (
    <div className="space-y-0.5">
      <div className="text-base font-semibold">
        {group.providerName}
        {group.providerType && <span className="text-muted-foreground ms-2 text-xs font-normal">({group.providerType})</span>}
      </div>
      {group.providerPhone && (
        <div className="text-muted-foreground text-xs">
          <span dir="ltr">{group.providerPhone}</span>
        </div>
      )}
      {group.providerEmail && (
        <div className="text-muted-foreground text-xs">
          <span dir="ltr">{group.providerEmail}</span>
        </div>
      )}
      {group.payoutAccount ? (
        <div className="pt-1 text-xs">
          <span className="font-medium">{t("providerPayoutAccount")}:</span> {group.payoutAccount.holderName}
          {group.payoutAccount.bankName && <> · {group.payoutAccount.bankName}</>}
          {group.payoutAccount.iban && (
            <div dir="ltr" className="font-mono break-all">
              {group.payoutAccount.iban}
            </div>
          )}
          {!group.payoutAccount.iban && group.payoutAccount.accountNumberLast4 && (
            <span dir="ltr" className="ms-2 font-mono">
              ****{group.payoutAccount.accountNumberLast4}
            </span>
          )}
        </div>
      ) : (
        <div className="pt-1 text-xs text-amber-800">{t("providerNoPayoutAccount")}</div>
      )}
    </div>
  );
}

function EntriesTable({ t, entries, actions }: { t: Translator; entries: ProviderPayoutEntry[]; actions: boolean }) {
  return (
    <div className="overflow-x-auto rounded-md border bg-white">
      <table className="w-full text-xs">
        <thead className="bg-muted/50">
          <tr>
            <th className="p-2 text-start">{t("bookingCode")}</th>
            <th className="p-2 text-start">{t("service")}</th>
            <th className="p-2 text-start">{t("customer")}</th>
            <th className="p-2 text-start">{t("providerCustomerPaid")}</th>
            <th className="p-2 text-start">{t("providerShare")}</th>
            <th className="p-2 text-start">{t("providerEntryStatus")}</th>
            {actions && <th className="p-2 text-start" />}
          </tr>
        </thead>
        <tbody>
          {entries.map((e) => (
            <tr key={e.id} className="border-t align-top">
              <td className="p-2">
                <span dir="ltr" className="font-mono">
                  {e.confirmationCode ?? "-"}
                </span>
                {e.selectedDate && <div className="text-muted-foreground">{formatDate(e.selectedDate)}</div>}
              </td>
              <td className="p-2">
                {e.serviceName ?? "-"}
                {e.entryType !== "earning" && (
                  <div className="text-muted-foreground">{t(`providerEntryType.${e.entryType}` as never)}</div>
                )}
              </td>
              <td className="p-2">{e.customerName ?? "-"}</td>
              <td className={`p-2 ${e.customerPayment ? CUSTOMER_PAYMENT_STYLE[e.customerPayment] : ""}`}>
                {e.customerPayment ? t(`providerCustomerPayment.${e.customerPayment}` as never) : "-"}
              </td>
              <td className={`p-2 whitespace-nowrap font-semibold ${Number(e.amount) < 0 ? "text-red-700" : ""}`}>
                {money(e.amount, e.currencyCode)}
              </td>
              <td className="p-2">
                <span className={`rounded-full px-2 py-0.5 font-semibold ${STATUS_STYLE[e.status]}`}>
                  {t(`providerEntryStatusValue.${e.status}` as never)}
                </span>
                {e.payoutReference && (
                  <div className="text-muted-foreground mt-1">
                    {t("payoutReference")}: <span dir="ltr" className="font-mono">{e.payoutReference}</span>
                  </div>
                )}
                {e.paidAt && <div className="text-muted-foreground">{formatDateTime(e.paidAt, PANEL_LOCALE)}</div>}
              </td>
              {actions && (
                <td className="space-y-1 p-2">
                  {e.status === "pending" && <ApproveEntriesButton ids={[e.id]} label={t("approveEntry")} />}
                  <CancelEntryForm id={e.id} />
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function WithdrawalQueuePage() {
  const locale = PANEL_LOCALE;
  const t = await getTranslations("Admin.accounting");
  const [due, recentlyPaid, withdrawals] = await Promise.all([
    listProviderPayoutsDue(),
    listRecentProviderPayouts(RECENT_DAYS),
    listPendingWithdrawals(),
  ]);

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>
          <PageHeader title={t("withdrawalQueueTitle")}>
              <ExportButtons report="withdrawals" locale={locale} />
            </PageHeader>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-8 pt-4">
        {/* 1. What each doctor / hotel / provider is owed from reservations. */}
        <Section title={t("providerPayoutsTitle")} description={t("providerPayoutsDescription")}>
          {due.length === 0 && <p className="text-muted-foreground text-sm">{t("queueEmpty")}</p>}
          {due.map((group) => {
            const pendingIds = group.entries.filter((e) => e.status === "pending").map((e) => e.id);
            const approvedIds = group.entries.filter((e) => e.status === "approved").map((e) => e.id);
            return (
              <div key={`${group.providerId}:${group.currencyCode}`} className="space-y-3 rounded-md border p-4 text-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-2">
                    <ProviderHeading t={t} group={group} />
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
                      <span className="text-amber-800">
                        {t("providerPendingTotal")}: <span className="font-semibold">{money(group.pendingTotal, group.currencyCode)}</span>
                      </span>
                      <span className="text-blue-800">
                        {t("providerApprovedTotal")}: <span className="font-semibold">{money(group.approvedTotal, group.currencyCode)}</span>
                      </span>
                    </div>
                    {pendingIds.length > 1 && <ApproveEntriesButton ids={pendingIds} label={t("approveAllEntries")} />}
                  </div>
                  {approvedIds.length > 0 && Number(group.approvedTotal) > 0 && (
                    <div className="sm:min-w-[320px]">
                      <MarkProviderPaidForm ids={approvedIds} totalLabel={money(group.approvedTotal, group.currencyCode)} />
                    </div>
                  )}
                </div>
                <EntriesTable t={t} entries={group.entries} actions />
              </div>
            );
          })}
        </Section>

        {/* 2. What was paid out recently, with the transfer reference. Read-only. */}
        <Section title={t("providerRecentlyPaidTitle", { days: RECENT_DAYS })}>
          {recentlyPaid.length === 0 && <p className="text-muted-foreground text-sm">{t("queueEmpty")}</p>}
          {recentlyPaid.map((group) => (
            <div key={`${group.providerId}:${group.currencyCode}`} className="space-y-2 rounded-md border p-4 text-sm">
              <div className="font-semibold">
                {group.providerName}
                {group.providerType && <span className="text-muted-foreground ms-2 text-xs font-normal">({group.providerType})</span>}
              </div>
              <EntriesTable t={t} entries={group.entries} actions={false} />
            </div>
          ))}
        </Section>

        {/* 3. Customer wallet withdrawals (accounting.withdrawal_requests), unchanged. */}
        <Section title={t("walletWithdrawalsTitle")} description={t("withdrawalQueueDescription")}>
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
        </Section>
      </CardContent>
    </Card>
  );
}
