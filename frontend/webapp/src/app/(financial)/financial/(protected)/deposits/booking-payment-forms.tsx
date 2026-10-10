"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";

import {
  approveBookingPaymentAction,
  recordBookingBalanceAction,
  rejectBookingPaymentAction,
  type BookingPaymentFormState,
} from "../actions";

function Feedback({ state }: { state: BookingPaymentFormState }) {
  if (state.error) return <p className="mt-2 text-xs font-medium text-red-700">{state.error}</p>;
  if (state.ok) return <p className="mt-2 text-xs font-medium text-green-700">{state.ok}</p>;
  return null;
}

/** Approve or reject a receipt / pay-at-place payment waiting for review. */
export function BookingPaymentReviewForms({ bookingId, paymentId }: { bookingId: string; paymentId: string }) {
  const t = useTranslations("Admin.accounting");
  const [approveState, approve, approving] = useActionState<BookingPaymentFormState, FormData>(
    approveBookingPaymentAction,
    {}
  );
  const [rejectState, reject, rejecting] = useActionState<BookingPaymentFormState, FormData>(
    rejectBookingPaymentAction,
    {}
  );
  const busy = approving || rejecting;

  return (
    <div className="grid gap-2 sm:min-w-[440px] sm:grid-cols-2">
      <form action={approve} className="rounded-md border border-green-200 bg-green-50 p-3 dark:bg-green-950/20">
        <input type="hidden" name="bookingId" value={bookingId} />
        <input type="hidden" name="paymentId" value={paymentId} />
        <p className="text-xs font-medium text-green-900 dark:text-green-200">{t("bookingApproveHint")}</p>
        <button
          disabled={busy}
          className="mt-2 w-full rounded bg-green-700 px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
        >
          {approving ? t("working") : t("approvePayment")}
        </button>
        <Feedback state={approveState} />
      </form>

      <form action={reject} className="rounded-md border border-red-200 bg-red-50 p-3 dark:bg-red-950/20">
        <input type="hidden" name="bookingId" value={bookingId} />
        <input type="hidden" name="paymentId" value={paymentId} />
        <label className="text-xs font-medium text-red-900 dark:text-red-200">{t("rejectReason")}</label>
        <input
          name="reason"
          type="text"
          defaultValue={t("defaultDepositRejectReason")}
          className="mt-1 h-9 w-full rounded border px-2"
        />
        <button
          disabled={busy}
          className="mt-2 w-full rounded bg-red-700 px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
        >
          {rejecting ? t("working") : t("reject")}
        </button>
        <Feedback state={rejectState} />
      </form>
    </div>
  );
}

/** "32000005.00" rials -> "3200000.5" Toman, exact (string math, no float rounding). */
function rialToToman(rial: string): string {
  const [int = "0", frac = ""] = rial.split(".");
  const padded = int.padStart(2, "0");
  const toman = padded.slice(0, -1).replace(/^0+(?=\d)/, "");
  const decimals = (padded.slice(-1) + frac).replace(/0+$/, "");
  return decimals ? `${toman}.${decimals}` : toman;
}

/** Record the rest of a partly paid booking as received. */
export function RecordBookingBalanceForm({
  bookingId,
  remainingAmount,
  currencyCode,
}: {
  bookingId: string;
  remainingAmount: string;
  currencyCode: string;
}) {
  const t = useTranslations("Admin.accounting");
  const [state, action, pending] = useActionState<BookingPaymentFormState, FormData>(recordBookingBalanceAction, {});
  // IRR is entered in Toman, the unit every other figure on this page is shown in; the
  // server multiplies by ten. Typing rials next to Toman figures is a factor-of-ten slip.
  const inToman = currencyCode.toUpperCase() === "IRR";
  const prefill = inToman ? rialToToman(remainingAmount) : remainingAmount.replace(/\.0+$/, "");

  return (
    <form
      action={action}
      className="rounded-md border border-green-200 bg-green-50 p-3 sm:min-w-[300px] dark:bg-green-950/20"
    >
      <input type="hidden" name="bookingId" value={bookingId} />
      <input type="hidden" name="unit" value={inToman ? "toman" : "raw"} />
      <label className="text-xs font-medium text-green-900 dark:text-green-200">{t("receivedAmount")}</label>
      {/* Pre-filled with everything still owed; lower it if only part of it arrived. */}
      <input
        name="amount"
        type="text"
        inputMode="decimal"
        dir="ltr"
        required
        defaultValue={prefill}
        className="mt-1 h-9 w-full rounded border px-2"
      />
      <p className="text-muted-foreground mt-1 text-[11px]">
        {inToman ? t("tomanUnitHint") : t("rawUnitHint", { currency: currencyCode })}
      </p>
      <label className="mt-2 block text-xs font-medium text-green-900 dark:text-green-200">{t("reference")}</label>
      <input name="reference" type="text" dir="ltr" className="mt-1 h-9 w-full rounded border px-2" />
      <button
        disabled={pending}
        className="mt-2 w-full rounded bg-green-700 px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
      >
        {pending ? t("working") : t("recordBalance")}
      </button>
      <Feedback state={state} />
    </form>
  );
}
