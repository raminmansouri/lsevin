"use server";

import { revalidatePath } from "next/cache";

import {
  approveDepositRequest,
  rejectDepositRequest,
} from "@/accounting/server/deposit.service";
import {
  approveWithdrawal,
  markWithdrawalPaid,
  releaseWithdrawal,
} from "@/accounting/server/withdrawal.service";
import { formatForDisplay } from "@/accounting/lib/format";
import { PANEL_LOCALE } from "@/accounting/lib/panel-locale";
import { AccountingAccessError, assertAccounting } from "@/accounting/server/access";
import {
  approveBookingPayment,
  BookingPaymentRuleError,
  recordBookingBalancePayment,
  rejectBookingPayment,
} from "@/accounting/server/booking-payments.service";
import {
  approveProviderEntries,
  cancelProviderEntry,
  markProviderEntriesPaid,
  ProviderPayoutRuleError,
} from "@/accounting/server/provider-payouts.service";

/**
 * Money-moving admin actions.
 *
 * Every export of a `"use server"` module is a public POST endpoint reachable by action
 * id, not by URL — the admin URL guard in middleware does nothing for them.
 * assertAccounting("operate") on the first line of each is the authorization boundary,
 * and it is the reason a customer cannot approve their own deposit. Do not remove it.
 */

function requiredString(formData: FormData, field: string): string {
  const value = String(formData.get(field) ?? "").trim();
  if (!value) throw new Error(`${field} is required.`);
  return value;
}

function optionalAmount(formData: FormData, field: string): string | undefined {
  const raw = String(formData.get(field) ?? "").trim();
  if (!raw) return undefined;
  // Validated as a plain decimal, then passed on as text — parsing it into a JS number
  // here would round an 18-decimal amount before it ever reached the ledger.
  if (!/^\d+(\.\d+)?$/.test(raw)) {
    throw new Error("The amount must be a positive decimal number.");
  }
  return raw;
}

// The panel moved off /admin onto financial.lsevin.com in 50411750; these paths did
// not move with it, so approving a deposit revalidated four routes that no longer
// exist and the queue the accountant was looking at kept showing the request.
function revalidateAccounting() {
  revalidatePath("/financial");
  revalidatePath("/financial/deposits");
  revalidatePath("/financial/withdrawals");
  revalidatePath("/financial/journal");
}

export async function approveDepositAction(formData: FormData) {
  const { userId } = await assertAccounting("operate");

  await approveDepositRequest({
    depositRequestId: requiredString(formData, "depositRequestId"),
    actorUserId: userId,
    confirmedAmount: optionalAmount(formData, "confirmedAmount"),
    note: String(formData.get("note") ?? "").trim() || undefined,
  });

  revalidateAccounting();
}

export async function rejectDepositAction(formData: FormData) {
  const { userId } = await assertAccounting("operate");

  await rejectDepositRequest({
    depositRequestId: requiredString(formData, "depositRequestId"),
    actorUserId: userId,
    reason: String(formData.get("reason") ?? "").trim() || "Rejected by admin",
  });

  revalidateAccounting();
}

export async function approveWithdrawalAction(formData: FormData) {
  const { userId } = await assertAccounting("operate");

  await approveWithdrawal({
    withdrawalRequestId: requiredString(formData, "withdrawalRequestId"),
    actorUserId: userId,
    note: String(formData.get("note") ?? "").trim() || undefined,
  });

  revalidateAccounting();
}

export async function rejectWithdrawalAction(formData: FormData) {
  const { userId } = await assertAccounting("operate");

  await releaseWithdrawal({
    withdrawalRequestId: requiredString(formData, "withdrawalRequestId"),
    actorUserId: userId,
    reason: String(formData.get("reason") ?? "").trim() || "Rejected by admin",
    outcome: "rejected",
  });

  revalidateAccounting();
}

/**
 * Records that the payout actually left. Separate from approval on purpose: approving is
 * a decision, paying is a fact, and the fact needs the bank or chain reference that
 * proves it.
 */
export async function markWithdrawalPaidAction(formData: FormData) {
  const { userId } = await assertAccounting("operate");

  await markWithdrawalPaid({
    withdrawalRequestId: requiredString(formData, "withdrawalRequestId"),
    actorUserId: userId,
    payoutReference: requiredString(formData, "payoutReference"),
  });

  revalidateAccounting();
}

export async function failWithdrawalAction(formData: FormData) {
  const { userId } = await assertAccounting("operate");

  await releaseWithdrawal({
    withdrawalRequestId: requiredString(formData, "withdrawalRequestId"),
    actorUserId: userId,
    reason: String(formData.get("reason") ?? "").trim() || "Payout failed",
    outcome: "failed",
  });

  revalidateAccounting();
}

export type BookingPaymentFormState = { error?: string; ok?: string };

/**
 * Turns a refusal into a sentence the accountant can act on, the same way the chart of
 * accounts does: a throw from a form action shows an error page (or, in production,
 * nothing), and the accountant cannot tell whether the payment was recorded.
 */
function bookingPaymentMessageFor(error: unknown): string {
  if (error instanceof AccountingAccessError) {
    return "این کار دسترسی «حسابدار» یا «مدیر مالی» می‌خواهد.";
  }
  if (error instanceof BookingPaymentRuleError) {
    switch (error.code) {
      case "invalid_amount":
        return "مبلغ باید یک عدد مثبت باشد.";
      case "not_found":
        return "این رزرو پیدا نشد.";
      case "cancelled":
        return "این رزرو لغو شده است.";
      case "already_paid":
        return "این رزرو کامل پرداخت شده است.";
      case "over_remaining":
        if (!error.remaining || !error.currencyCode) return "مبلغ بیشتر از باقی‌مانده است.";
        {
          const left = formatForDisplay(error.remaining, error.currencyCode, PANEL_LOCALE);
          return `مبلغ بیشتر از باقی‌مانده است. باقی‌مانده: ${left.value} ${left.unit}`;
        }
    }
  }
  if (error instanceof Error && /payment not found/i.test(error.message)) {
    return "این پرداخت پیدا نشد؛ احتمالاً قبلاً بررسی شده است. صفحه را تازه کنید.";
  }
  // Not the accountant's input: keep the detail in the server log, not on screen.
  console.error("financial panel booking payment action failed", error);
  return "ثبت انجام نشد؛ خطای سرور رخ داد. دوباره تلاش کنید و اگر تکرار شد خبر دهید.";
}

/**
 * The amount as typed: Persian or Arabic digits and thousands separators are accepted,
 * and an IRR amount entered in Toman (`unit=toman`) is turned into rials by shifting the
 * decimal point, not by float multiplication. Anything else is passed through for the
 * service to refuse.
 */
function parseEnteredAmount(formData: FormData): string {
  const raw = String(formData.get("amount") ?? "")
    .trim()
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
    .replace(/٫/g, ".")
    .replace(/[,٬،\s]/g, "");
  if (String(formData.get("unit") ?? "") !== "toman" || !/^\d+(\.\d+)?$/.test(raw)) return raw;
  const [int, frac = ""] = raw.split(".");
  const rial = `${int}${frac.slice(0, 1).padEnd(1, "0")}`.replace(/^0+(?=\d)/, "");
  return frac.length > 1 ? `${rial}.${frac.slice(1)}` : rial;
}

/**
 * Reservation payments. Approve and reject settle a receipt or a pay-at-place payment;
 * record-balance books the rest of a partly paid reservation as received. All three
 * go through confirmBookingPayment, the same path as the gateway and /admin/payments.
 */
export async function approveBookingPaymentAction(
  _prev: BookingPaymentFormState,
  formData: FormData
): Promise<BookingPaymentFormState> {
  try {
    const { userId } = await assertAccounting("operate");

    await approveBookingPayment({
      bookingId: requiredString(formData, "bookingId"),
      paymentId: requiredString(formData, "paymentId"),
      actorUserId: userId,
    });

    revalidateAccounting();
    return { ok: "پرداخت تأیید شد." };
  } catch (error) {
    return { error: bookingPaymentMessageFor(error) };
  }
}

export async function rejectBookingPaymentAction(
  _prev: BookingPaymentFormState,
  formData: FormData
): Promise<BookingPaymentFormState> {
  try {
    const { userId } = await assertAccounting("operate");

    await rejectBookingPayment({
      bookingId: requiredString(formData, "bookingId"),
      paymentId: requiredString(formData, "paymentId"),
      actorUserId: userId,
      reason: String(formData.get("reason") ?? "").trim() || "Rejected by admin",
    });

    revalidateAccounting();
    return { ok: "پرداخت رد شد." };
  } catch (error) {
    return { error: bookingPaymentMessageFor(error) };
  }
}

export async function recordBookingBalanceAction(
  _prev: BookingPaymentFormState,
  formData: FormData
): Promise<BookingPaymentFormState> {
  try {
    const { userId } = await assertAccounting("operate");

    await recordBookingBalancePayment({
      bookingId: requiredString(formData, "bookingId"),
      amount: parseEnteredAmount(formData),
      actorUserId: userId,
      reference: String(formData.get("reference") ?? "").trim() || undefined,
      note: String(formData.get("note") ?? "").trim() || undefined,
    });

    revalidateAccounting();
    return { ok: "باقی‌مانده ثبت شد." };
  } catch (error) {
    return { error: bookingPaymentMessageFor(error) };
  }
}

export type ProviderPayoutFormState = { error?: string; ok?: string };

function providerPayoutMessageFor(error: unknown): string {
  if (error instanceof AccountingAccessError) {
    return "این کار دسترسی «حسابدار» یا «مدیر مالی» می‌خواهد.";
  }
  if (error instanceof ProviderPayoutRuleError) {
    switch (error.code) {
      case "nothing_selected":
        return "موردی انتخاب نشده است.";
      case "changed":
        return "این موارد در این فاصله تغییر کرده‌اند. صفحه را تازه کنید و دوباره بررسی کنید.";
      case "mixed":
        return "هر پرداخت فقط برای یک طرف حساب و یک ارز ثبت می‌شود.";
      case "not_positive":
        return "برای این موارد مبلغی قابل پرداخت نیست.";
      case "reference_required":
        return "شماره پیگیری انتقال را وارد کنید.";
    }
  }
  console.error("financial panel provider payout action failed", error);
  return "ثبت انجام نشد؛ خطای سرور رخ داد. دوباره تلاش کنید و اگر تکرار شد خبر دهید.";
}

function entryIds(formData: FormData): string[] {
  return formData.getAll("entryId").map((v) => String(v));
}

/**
 * Provider payouts (doctors, hotels, ...): approve what is owed, then record the bank
 * transfer that paid it. Reads and writes commercial.provider_ledgers, the same rows
 * /admin/commercial/provider-ledgers shows.
 */
export async function approveProviderEntriesAction(
  _prev: ProviderPayoutFormState,
  formData: FormData
): Promise<ProviderPayoutFormState> {
  try {
    const { userId } = await assertAccounting("operate");
    const result = await approveProviderEntries({ ids: entryIds(formData), actorUserId: userId });
    revalidateAccounting();
    return { ok: `${result.approved} مورد تأیید شد.` };
  } catch (error) {
    return { error: providerPayoutMessageFor(error) };
  }
}

export async function cancelProviderEntryAction(
  _prev: ProviderPayoutFormState,
  formData: FormData
): Promise<ProviderPayoutFormState> {
  try {
    const { userId } = await assertAccounting("operate");
    await cancelProviderEntry({
      id: requiredString(formData, "entryId"),
      actorUserId: userId,
      reason: String(formData.get("reason") ?? "").trim() || "Cancelled in financial panel",
    });
    revalidateAccounting();
    return { ok: "لغو شد." };
  } catch (error) {
    return { error: providerPayoutMessageFor(error) };
  }
}

export async function markProviderPaidAction(
  _prev: ProviderPayoutFormState,
  formData: FormData
): Promise<ProviderPayoutFormState> {
  try {
    const { userId } = await assertAccounting("operate");
    await markProviderEntriesPaid({
      ids: entryIds(formData),
      actorUserId: userId,
      reference: String(formData.get("payoutReference") ?? ""),
    });
    revalidateAccounting();
    return { ok: "پرداخت ثبت شد." };
  } catch (error) {
    return { error: providerPayoutMessageFor(error) };
  }
}
