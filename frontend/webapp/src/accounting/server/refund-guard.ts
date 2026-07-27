import "server-only";

import type { TransactionSql } from "postgres";

type Tx = TransactionSql<Record<string, never>>;

export class RefundGuardError extends Error {
  constructor(
    message: string,
    readonly code: "over_refund" | "booking_not_found" | "invalid_amount"
  ) {
    super(message);
    this.name = "RefundGuardError";
  }
}

/**
 * Cross-engine guard for refunds.
 *
 * Two refund engines write the same three `commercial` tables from two different admin
 * screens — `features/refunds` (approve straight to wallet) and
 * `features/commercial/lib/server/refund-engine` (four-state lifecycle). Neither could
 * see the other properly:
 *
 *   * Engine A capped the amount at the booking's paid amount, but only after reading
 *     it without a lock — two approvals racing both saw the same remainder.
 *   * Engine B had no cap at all. It summed the lines of its own request and refunded
 *     them, with no idea what engine A had already paid out on the same booking.
 *
 * So one booking could be refunded twice from two screens, for up to twice what the
 * customer ever paid. This closes both halves: an advisory lock serialises every refund
 * on a booking regardless of which engine is running, and the remaining refundable
 * amount is computed from what BOTH engines have actually executed.
 *
 * `commercial.refunds` is the measure of "already refunded" rather than
 * `commercial.refund_lines`, because engine B writes its lines when the request is
 * *created* while engine A writes them on execution — counting lines would block
 * legitimate refunds for one engine and miss nothing for the other. Both engines insert
 * into `refunds` only when money actually moves.
 */
export async function assertRefundable(
  input: { bookingId: string; amount: string | number },
  tx: Tx
): Promise<{ paidAmount: string; alreadyRefunded: string; remaining: string }> {
  const amount = String(input.amount);

  // Serialisation point. Taken on the booking, so it holds across both engines and both
  // admin screens. hashtext of the uuid keeps the lock space per-booking rather than
  // global, so refunds on unrelated bookings never wait on each other.
  await tx`select pg_advisory_xact_lock(hashtext(${"refund:" + input.bookingId}))`;

  const [row] = await tx<
    { paid_amount: string; already_refunded: string; remaining: string; exceeds: boolean }[]
  >`
    with booking as (
      select coalesce(paid_amount, 0) as paid_amount
      from booking.bookings
      where id = ${input.bookingId}
      limit 1
    ),
    executed as (
      select coalesce(sum(r.refund_amount), 0) as already_refunded
      from commercial.refunds r
      join commercial.refund_requests rr on rr.id = r.refund_request_id
      where rr.booking_id = ${input.bookingId}
        and lower(coalesce(r.status, '')) = 'refunded'
    )
    select
      booking.paid_amount::text                                        as paid_amount,
      executed.already_refunded::text                                  as already_refunded,
      greatest(booking.paid_amount - executed.already_refunded, 0)::text as remaining,
      (executed.already_refunded + ${amount}::numeric) > booking.paid_amount as exceeds
    from booking, executed
  `;

  if (!row) {
    throw new RefundGuardError(`Booking ${input.bookingId} was not found.`, "booking_not_found");
  }

  const [valid] = await tx<{ positive: boolean }[]>`select ${amount}::numeric > 0 as positive`;
  if (!valid.positive) {
    throw new RefundGuardError("The refund amount must be greater than zero.", "invalid_amount");
  }

  if (row.exceeds) {
    throw new RefundGuardError(
      `Refunding ${amount} would exceed what this booking can be refunded. ` +
        `Paid ${row.paid_amount}, already refunded ${row.already_refunded}, remaining ${row.remaining}. ` +
        `Check the other refund screen — both write the same records.`,
      "over_refund"
    );
  }

  return {
    paidAmount: row.paid_amount,
    alreadyRefunded: row.already_refunded,
    remaining: row.remaining,
  };
}
