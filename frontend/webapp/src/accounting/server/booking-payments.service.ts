import "server-only";

import db from "@/config/database/db";
import { confirmBookingPayment } from "@/features/booking-pro/server/payment-repository";

/**
 * Money-moving side of the reservation queue in the financial panel.
 *
 * Everything settles through confirmBookingPayment -- the same transaction the gateway
 * callback and the /admin/payments review use -- so a booking ends up in the same state
 * whichever screen approved it.
 */

export class BookingPaymentRuleError extends Error {
  constructor(
    message: string,
    readonly code: "invalid_amount" | "not_found" | "cancelled" | "already_paid" | "over_remaining",
    readonly remaining?: string,
    readonly currencyCode?: string
  ) {
    super(message);
    this.name = "BookingPaymentRuleError";
  }
}

export async function approveBookingPayment(input: { bookingId: string; paymentId: string; actorUserId: string }) {
  return confirmBookingPayment({
    bookingId: input.bookingId,
    paymentId: input.paymentId,
    userId: input.actorUserId,
    status: "Succeeded",
    actingAsAdmin: true,
    payload: { reviewedIn: "financial_panel" },
  });
}

export async function rejectBookingPayment(input: {
  bookingId: string;
  paymentId: string;
  actorUserId: string;
  reason: string;
}) {
  return confirmBookingPayment({
    bookingId: input.bookingId,
    paymentId: input.paymentId,
    userId: input.actorUserId,
    status: "Failed",
    actingAsAdmin: true,
    payload: { reviewRejectedReason: input.reason, reviewedIn: "financial_panel" },
  });
}

const OPEN_MANUAL_COLLECTION = "manual_collection";

/**
 * Records the rest of a partly paid booking as received (paid at the place, by card,
 * cash or transfer). Creates the payment row and settles it, so paid_amount, the
 * payment status and the customer's view all move together.
 *
 * The amount is checked against what is still owed under a lock on the booking, and an
 * in-flight record from a second click counts as owed-for, so a double submit cannot
 * record the balance twice.
 */
export async function recordBookingBalancePayment(input: {
  bookingId: string;
  amount: string;
  actorUserId: string;
  reference?: string;
  note?: string;
}) {
  const amount = Number(input.amount);
  if (!/^\d+(\.\d+)?$/.test(input.amount) || !Number.isFinite(amount) || amount <= 0) {
    throw new BookingPaymentRuleError("The amount must be a positive number.", "invalid_amount");
  }

  const paymentId = await db.begin(async (tx) => {
    // Lock first, read second. Under READ COMMITTED a statement reads with the snapshot
    // it started with, so a read that also waits for the lock would miss the payment row
    // a concurrent click inserted and committed while it waited.
    await tx`select 1 from booking.bookings where id = ${input.bookingId} for no key update`;

    const [booking] = await tx<
      {
        userId: string | null;
        bookingStatus: string | null;
        total: string;
        paid: string;
        inFlight: string;
        currency: string;
      }[]
    >`
      select
        b.user_id::text as "userId",
        b.booking_status as "bookingStatus",
        coalesce(b.total_amount, pt.total_amount, b.display_total_amount, 0)::text as "total",
        coalesce(b.paid_amount, 0)::text as "paid",
        coalesce((
          select sum(p.amount) from booking.payments p
          where p.booking_id = b.id and p.status = 'Pending' and p.payment_method = ${OPEN_MANUAL_COLLECTION}
        ), 0)::text as "inFlight",
        coalesce(
          nullif(b.currency_code, ''),
          nullif(pt.payment_currency_code, ''),
          (select p.currency from booking.payments p where p.booking_id = b.id order by p.created_at desc limit 1),
          'IRR'
        ) as "currency"
      from booking.bookings b
      left join commercial.booking_payment_terms pt on pt.booking_id = b.id
      where b.id = ${input.bookingId}
      limit 1
    `;

    if (!booking) throw new BookingPaymentRuleError("Booking not found.", "not_found");
    if (["cancelled", "canceled", "rejected", "refunded"].includes(String(booking.bookingStatus ?? "").toLowerCase())) {
      throw new BookingPaymentRuleError("This booking is cancelled.", "cancelled");
    }

    const remaining = Number(booking.total) - Number(booking.paid) - Number(booking.inFlight);
    if (remaining <= 0.005) throw new BookingPaymentRuleError("This booking is already paid in full.", "already_paid");
    if (amount > remaining + 0.005) {
      throw new BookingPaymentRuleError(
        `The amount is more than what is left to pay (${remaining}).`,
        "over_remaining",
        remaining.toFixed(2),
        booking.currency
      );
    }

    const [row] = await tx<{ id: string }[]>`
      insert into booking.payments (booking_id, user_id, payment_method, gateway, amount, currency, status, external_reference, gateway_payload)
      values (
        ${input.bookingId},
        ${booking.userId},
        ${OPEN_MANUAL_COLLECTION},
        'financial_panel',
        ${input.amount},
        ${booking.currency},
        'Pending',
        ${input.reference || null},
        ${{ flow: OPEN_MANUAL_COLLECTION, recordedBy: input.actorUserId, note: input.note ?? null } as never}
      )
      returning id::text as id
    `;
    return row.id;
  });

  try {
    return await confirmBookingPayment({
      bookingId: input.bookingId,
      paymentId,
      userId: input.actorUserId,
      status: "Succeeded",
      externalReference: input.reference || null,
      actingAsAdmin: true,
      payload: { reviewedIn: "financial_panel" },
    });
  } catch (error) {
    // Nothing was credited if the confirm failed; drop the row so it does not hold the
    // remaining balance hostage as an in-flight record.
    await db`
      delete from booking.payments
      where id = ${paymentId} and status = 'Pending' and payment_method = ${OPEN_MANUAL_COLLECTION}
    `.catch(() => undefined);
    throw error;
  }
}
