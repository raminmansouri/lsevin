"use client";

import { useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";

import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

import type { RefundQuote } from "../../../domain/cancellation";
import { cancelBookingAction } from "../../../server/actions/customer";
import { ToursErrorAlert, type ToursActionError } from "../../shared/error-alert";
import { formatMoney, formatNumber } from "../../shared/format";

/** Customer cancellation with the refund quoted from the accepted policy snapshot (C-099, AT-12). */
export function CancelBooking({
  bookingId,
  quote,
  policyVersion,
  onDone,
}: {
  bookingId: string;
  quote: { status: string; refund: RefundQuote; currency: string };
  policyVersion: number;
  onDone: () => void;
}) {
  const t = useTranslations("TourApp.voucher.cancel");
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<ToursActionError | null>(null);
  const [pending, start] = useTransition();
  const r = quote.refund;
  const paid = r.refundAmount + r.feeAmount > 0;
  const text = r.reason === "after_departure"
    ? t("afterDeparture")
    : !paid
      ? t("noPayment")
      : t("quote", { version: formatNumber(policyVersion, locale), amount: formatMoney(r.refundAmount, quote.currency, locale), percent: formatNumber(r.refundPercent, locale) });

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <button type="button" className="min-h-12 w-full rounded-2xl border border-red-300 bg-white text-sm font-semibold text-red-700 hover:bg-red-50" data-testid="cancel-booking">
          {t("button")}
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogTitle>{t("title")}</AlertDialogTitle>
        <AlertDialogDescription data-testid="cancel-quote">{text}</AlertDialogDescription>
        <div className="space-y-1">
          <label htmlFor={`cancel-reason-${bookingId}`} className="text-sm font-medium">
            {t("reason")}
          </label>
          <textarea id={`cancel-reason-${bookingId}`} value={reason} onChange={(e) => setReason(e.target.value)} maxLength={200} rows={2} className="w-full rounded-xl border border-slate-300 p-2 text-sm" />
        </div>
        <ToursErrorAlert error={error} />
        <AlertDialogFooter>
          <AlertDialogCancel className="min-h-11">{t("keep")}</AlertDialogCancel>
          <button
            type="button"
            disabled={pending}
            data-testid="confirm-cancel"
            onClick={() =>
              start(async () => {
                setError(null);
                const res = await cancelBookingAction(bookingId, reason).catch(() => null);
                if (!res?.ok) {
                  setError(res && !res.ok ? res.error : { kind: "infrastructure", code: "service_unavailable" });
                  return;
                }
                setOpen(false);
                toast.success(res.data.refund.refundAmount > 0 ? t("refundRequested", { amount: formatMoney(res.data.refund.refundAmount, quote.currency, locale) }) : t("done"));
                onDone();
              })
            }
            className="min-h-11 rounded-md bg-red-600 px-4 text-sm font-semibold text-white disabled:opacity-60"
          >
            {t("confirm")}
          </button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
