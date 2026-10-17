import "server-only";

import db from "@/config/database/db";

/**
 * Reservation money, read straight from the booking tables.
 *
 * The deposit queue used to read only accounting.deposit_requests, which is the wallet
 * top-up flow and is not written by any checkout, so a reservation paid by receipt, at
 * the place or online never reached this panel. booking.payments and booking.bookings
 * are what the checkout writes and what the customer app shows, so the panel reads
 * them directly: one source of truth, nothing copied, nothing to drift.
 */

const PANEL_TRANSLATION_LOCALE = "fa-IR";

export type BookingPaymentKind = "full" | "deposit" | "partial";

type BookingMoney = {
  bookingId: string;
  confirmationCode: string | null;
  serviceName: string;
  providerName: string;
  selectedDate: string | null;
  customerName: string | null;
  customerEmail: string | null;
  currencyCode: string;
  totalAmount: string;
  paidAmount: string;
  remainingAmount: string;
  /**
   * full    - paid in full
   * deposit - the part due now is paid, the rest is paid at the place
   * partial - not even the part due now is fully paid
   */
  kind: BookingPaymentKind;
};

export type BookingPaymentReviewRow = BookingMoney & {
  paymentId: string;
  method: string;
  amount: string;
  paymentCurrencyCode: string;
  receiptUrl: string | null;
  receiptMimeType: string | null;
  createdAt: string;
};

export type PartlyPaidBookingRow = BookingMoney & {
  lastPaymentAt: string | null;
  /** A receipt for this booking is already waiting in the review list above. */
  hasPendingReview: boolean;
};

export type RecentBookingPaymentRow = BookingMoney & {
  paymentId: string;
  method: string;
  gateway: string | null;
  amount: string;
  paymentCurrencyCode: string;
  externalReference: string | null;
  paidAt: string;
};

// Shared joins and computed columns. `b` is booking.bookings; `bm` exposes the booking's
// money in the currency the booking is charged in -- the same figures
// confirmBookingPayment compares when it decides Paid vs PartiallyPaid.
const bookingMoneyColumns = db`
  b.id::text as "bookingId",
  b.confirmation_code as "confirmationCode",
  coalesce(
    nullif(common.get_translation_t(ps.display_name_translations, ${PANEL_TRANSLATION_LOCALE}, 'en-US'), ''),
    nullif(common.get_translation_t(sd.name_translations, ${PANEL_TRANSLATION_LOCALE}, 'en-US'), ''),
    '-'
  ) as "serviceName",
  coalesce(nullif(common.get_translation_t(sp.name_translations, ${PANEL_TRANSLATION_LOCALE}, 'en-US'), ''), '-') as "providerName",
  b.selected_date::text as "selectedDate",
  nullif(trim(concat(coalesce(u.first_name, ''), ' ', coalesce(u.last_name, ''))), '') as "customerName",
  u.email as "customerEmail",
  bm.currency_code as "currencyCode",
  bm.total_amount::text as "totalAmount",
  bm.paid_amount::text as "paidAmount",
  greatest(bm.total_amount - bm.paid_amount, 0)::text as "remainingAmount",
  case
    when bm.paid_amount >= bm.total_amount - 0.005 then 'full'
    when lower(coalesce(b.payment_status, '')) in ('partiallypaid', 'partially_paid', 'partial') then 'partial'
    when bm.paid_amount > 0 then 'deposit'
    else 'partial'
  end as "kind"
`;

const bookingMoneyJoins = db`
  join booking.bookings b on b.id = bm.booking_id
  left join category.service_providers sp on sp.id = b.provider_id
  left join category.provider_services ps on ps.id = b.service_id
  left join category.service_definitions sd on sd.id = ps.service_definition_id
  left join identity.asp_net_users u on u.id = b.user_id
`;

// One row per booking with its total, paid and currency. Total and currency follow the
// checkout (createBookingPaymentIntent): booking total first, then the payment terms.
const bookingMoneyCte = db`
  booking_money as (
    select
      b.id as booking_id,
      coalesce(b.total_amount, pt.total_amount, b.display_total_amount, 0)::numeric as total_amount,
      coalesce(b.paid_amount, 0)::numeric as paid_amount,
      coalesce(
        nullif(b.currency_code, ''),
        nullif(pt.payment_currency_code, ''),
        (select p.currency from booking.payments p where p.booking_id = b.id order by p.created_at desc limit 1),
        'IRR'
      ) as currency_code
    from booking.bookings b
    left join commercial.booking_payment_terms pt on pt.booking_id = b.id
  )
`;

/**
 * Receipts and pay-at-place payments a person has to check before the booking counts
 * as paid. Online gateway attempts that are still Pending are not here: those are a
 * customer who left the bank page, and the gateway callback settles them on its own.
 */
export async function listBookingPaymentsForReview(limit = 200): Promise<BookingPaymentReviewRow[]> {
  return db<BookingPaymentReviewRow[]>`
    with ${bookingMoneyCte}
    select
      p.id::text as "paymentId",
      p.payment_method as "method",
      p.amount::text as "amount",
      p.currency as "paymentCurrencyCode",
      p.gateway_payload->'receipt'->>'fileUrl' as "receiptUrl",
      p.gateway_payload->'receipt'->>'mimeType' as "receiptMimeType",
      p.created_at::text as "createdAt",
      ${bookingMoneyColumns}
    from booking.payments p
    join booking_money bm on bm.booking_id = p.booking_id
    ${bookingMoneyJoins}
    where p.status = 'Pending'
      and p.payment_method in ('bank_receipt', 'pay_on_delivery', 'manual_card', 'cash_on_delivery')
      and lower(coalesce(b.booking_status, '')) not in ('cancelled', 'canceled', 'rejected', 'refunded')
    order by p.created_at asc
    limit ${limit}
  `;
}

/**
 * Bookings with money in but not all of it: the deposit is paid and the rest is due at
 * the place, or less than the part due now arrived. They stay here until the rest is
 * recorded, which turns them into fully paid bookings.
 */
export async function listPartlyPaidBookings(limit = 200): Promise<PartlyPaidBookingRow[]> {
  return db<PartlyPaidBookingRow[]>`
    with ${bookingMoneyCte}
    select
      (
        select max(p.updated_at)::text from booking.payments p
        where p.booking_id = b.id and lower(p.status) in ('succeeded', 'paid', 'captured', 'completed')
      ) as "lastPaymentAt",
      exists (
        select 1 from booking.payments p
        where p.booking_id = b.id and p.status = 'Pending'
          and p.payment_method in ('bank_receipt', 'pay_on_delivery', 'manual_card', 'cash_on_delivery')
      ) as "hasPendingReview",
      ${bookingMoneyColumns}
    from booking_money bm
    ${bookingMoneyJoins}
    where bm.paid_amount > 0
      and bm.paid_amount < bm.total_amount - 0.005
      and lower(coalesce(b.booking_status, '')) not in ('cancelled', 'canceled', 'rejected', 'refunded')
      and lower(coalesce(b.payment_status, '')) not in ('refunded', 'failed')
    order by b.create_date desc
    limit ${limit}
  `;
}

/** Reservation payments that went through, newest first, for the record. */
export async function listRecentBookingPayments(days = 30, limit = 200): Promise<RecentBookingPaymentRow[]> {
  return db<RecentBookingPaymentRow[]>`
    with ${bookingMoneyCte}
    select
      p.id::text as "paymentId",
      p.payment_method as "method",
      p.gateway,
      p.amount::text as "amount",
      p.currency as "paymentCurrencyCode",
      p.external_reference as "externalReference",
      p.updated_at::text as "paidAt",
      ${bookingMoneyColumns}
    from booking.payments p
    join booking_money bm on bm.booking_id = p.booking_id
    ${bookingMoneyJoins}
    where lower(p.status) in ('succeeded', 'paid', 'captured', 'completed')
      and p.updated_at >= now() - make_interval(days => ${days})
    order by p.updated_at desc
    limit ${limit}
  `;
}
