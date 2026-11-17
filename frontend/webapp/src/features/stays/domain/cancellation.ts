/**
 * Stay cancellation quote (H10). Rules come from the policy snapshot taken at
 * booking time and are measured against the check-in instant: the check-in
 * date at the property's check-in time in the property's time zone. A
 * non-refundable rate always refunds 0 unless the operator cancelled.
 */
import { localToInstant } from "@/features/tours/domain/calendar";
import { normalizeRules, refundQuote, type CancellationRule, type RefundQuote } from "@/features/tours/domain/cancellation";

export type { CancellationRule, RefundQuote };
export { normalizeRules };

export function checkInInstant(checkIn: string, checkInTime: string, timeZone: string): Date {
  return localToInstant(checkIn, checkInTime.slice(0, 5), timeZone);
}

export function stayRefundQuote(opts: {
  rules: unknown;
  refundable: boolean;
  checkIn: string;
  checkInTime: string;
  timeZone: string;
  now: Date;
  paidAmount: number;
  currencyDecimals: number;
  operatorCancelled?: boolean;
}): RefundQuote {
  return refundQuote({
    rules: opts.refundable ? opts.rules : [],
    departureAt: checkInInstant(opts.checkIn, opts.checkInTime, opts.timeZone),
    now: opts.now,
    paidAmount: opts.paidAmount,
    currencyDecimals: opts.currencyDecimals,
    operatorCancelled: opts.operatorCancelled,
  });
}

/** The latest instant a full refund is still available, for "free cancellation until …". */
export function freeCancellationUntil(rules: unknown, refundable: boolean, checkIn: Date): Date | null {
  if (!refundable) return null;
  const full = normalizeRules(rules).filter((r) => r.refundPercent >= 100).sort((a, b) => a.hoursBefore - b.hoursBefore)[0];
  if (!full) return null;
  return new Date(checkIn.getTime() - full.hoursBefore * 3_600_000);
}
