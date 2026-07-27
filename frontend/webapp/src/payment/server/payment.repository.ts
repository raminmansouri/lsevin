import "server-only";

import sql from "@/config/database/db";
import type { PaymentAttempt, PaymentGatewayCode, PaymentVerificationResult } from "../types";
import { COUNTRY_CODES } from "@/app/[locale]/n/app/components/CountryCodeSelector";

const UUID_RE = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

function isUuid(value?: string | null): value is string {
  return typeof value === "string" && UUID_RE.test(value.trim());
}

function toNumber(value: unknown, fallback = 0): number {
  if (value === null || value === undefined || value === "") return fallback;
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
}

function normalizeCurrency(value?: string | null, fallback = "USD") {
  return String(value || fallback).trim().toUpperCase();
}

// Currencies with no minor unit — round to whole units. Everything else keeps
// two decimals (crypto invoices priced in USD/EUR need cent precision; Zarinpal
// always passes IRR/IRT so its behaviour is unchanged).
const ZERO_DECIMAL_CURRENCIES = new Set(["IRR", "IRT", "JPY", "KRW", "VND"]);

function roundAmountForCurrency(amount: number, currency: string): number {
  const code = String(currency || "").trim().toUpperCase();
  if (ZERO_DECIMAL_CURRENCIES.has(code)) return Math.round(amount);
  return Math.round(amount * 100) / 100;
}

function jsonb(value: unknown) {
  return JSON.stringify(value ?? {});
}

type BookingPaymentBaseRow = {
  bookingId: string;
  userId: string;
  sourceAmount: string | number;
  sourceCurrency: string;
  bookingStatus: string | null;
  paymentStatus: string | null;
  providerName: string | null;
  serviceName: string | null;
  email: string | null;
  phoneCountryCode: string | null;
  phoneNumber: string | null;
};

type ConversionRow = {
  targetAmount: string | number;
  targetCurrencyCode: string;
  appliedRate: string | number | null;
};

export type GatewayPaymentRow = {
  paymentId: string;
  bookingId: string;
  userId: string | null;
  amount: string | number;
  currency: string;
  sourceAmount: string | number | null;
  sourceCurrency: string | null;
  status: string;
  externalReference: string | null;
  gateway: PaymentGatewayCode | string | null;
  gatewayPayload: unknown;
};

export async function prepareBookingPaymentAttempt(input: {
  bookingId: string;
  userId: string;
  gateway: PaymentGatewayCode;
  locale?: string | null;
  targetCurrency: string;
}): Promise<PaymentAttempt> {
  if (!isUuid(input.bookingId) || !isUuid(input.userId)) {
    throw new Error("Invalid booking or user id.");
  }

  const rows = await sql<BookingPaymentBaseRow[]>`
    select
      b.id::text as "bookingId",
      b.user_id::text as "userId",
      greatest(
        coalesce(b.display_total_amount, b.total_amount, b.source_total_amount, ps.value, 0) - coalesce(b.paid_amount, 0),
        0
      )::text as "sourceAmount",
      upper(coalesce(nullif(b.payment_currency_code, ''), nullif(b.display_currency_code, ''), nullif(b.currency_code, ''), nullif(ps.currency, ''), 'USD')) as "sourceCurrency",
      b.booking_status as "bookingStatus",
      b.payment_status as "paymentStatus",
      common.get_translation_t(sp.name_translations, ${input.locale || "fa-IR"}, 'en-US') as "providerName",
      coalesce(
        nullif(common.get_translation_t(ps.display_name_translations, ${input.locale || "fa-IR"}, 'en-US'), ''),
        nullif(common.get_translation_t(sd.name_translations, ${input.locale || "fa-IR"}, 'en-US'), ''),
        'Booking'
      ) as "serviceName",
      u.email,
      u.phone_number_country_code as "phoneCountryCode",
      u.phone_number as "phoneNumber"
    from booking.bookings b
    join category.service_providers sp on sp.id = b.provider_id
    join category.provider_services ps on ps.id = b.service_id
    left join category.service_definitions sd on sd.id = ps.service_definition_id
    left join identity.asp_net_users u on u.id = b.user_id
    where b.id = ${input.bookingId}::uuid
      and b.user_id = ${input.userId}::uuid
    limit 1
  `;

  const booking = rows[0];
  if (!booking) {
    throw new Error("Booking was not found or does not belong to your account.");
  }

  const normalizedBookingStatus = String(booking.bookingStatus || "").trim().toLowerCase();
  if (["cancelled", "canceled", "completed", "done"].includes(normalizedBookingStatus)) {
    throw new Error("This booking cannot be paid because it is cancelled or completed.");
  }

  const sourceAmount = toNumber(booking.sourceAmount);
  if (sourceAmount <= 0) {
    throw new Error("This booking does not have a remaining payable amount.");
  }

  const sourceCurrency = normalizeCurrency(booking.sourceCurrency);
  const targetCurrency = normalizeCurrency(input.targetCurrency);

  let targetAmount = sourceAmount;
  let appliedRate: number | null = sourceCurrency === targetCurrency ? 1 : null;

  if (sourceCurrency !== targetCurrency) {
    const convertedRows = await sql<ConversionRow[]>`
      select
        target_amount::text as "targetAmount",
        target_currency_code as "targetCurrencyCode",
        applied_rate::text as "appliedRate"
      from finance.convert_money(${sourceAmount}, ${sourceCurrency}, ${targetCurrency}, 'standard')
      limit 1
    `;

    const conversion = convertedRows[0];
    if (!conversion) {
      throw new Error(`No exchange rate found from ${sourceCurrency} to ${targetCurrency}.`);
    }

    targetAmount = toNumber(conversion.targetAmount);
    appliedRate = toNumber(conversion.appliedRate, 0);
  }

  const roundedGatewayAmount = roundAmountForCurrency(targetAmount, targetCurrency);
  if (roundedGatewayAmount <= 0) {
    throw new Error("Converted payment amount is not valid.");
  }

  const pendingRows = await sql<{ id: string }[]>`
    insert into booking.payments (
      booking_id,
      user_id,
      payment_method,
      gateway,
      amount,
      currency,
      status,
      source_currency_code,
      settlement_currency_code,
      source_amount,
      settlement_amount,
      exchange_rate,
      gateway_payload
    ) values (
      ${input.bookingId}::uuid,
      ${input.userId}::uuid,
      ${input.gateway},
      ${input.gateway},
      ${roundedGatewayAmount},
      ${targetCurrency},
      'Pending',
      ${sourceCurrency},
      ${targetCurrency},
      ${sourceAmount},
      ${roundedGatewayAmount},
      ${appliedRate},
      ${jsonb({ stage: "created", sourceCurrency, sourceAmount, targetCurrency, targetAmount: roundedGatewayAmount })}::jsonb
    )
    returning id::text
  `;

  const paymentId = pendingRows[0]?.id;
  if (!paymentId) {
    throw new Error("Could not create a payment attempt.");
  }

  const code = booking.phoneCountryCode =='IR' ? '0': COUNTRY_CODES[booking.phoneCountryCode];
  const mobile = [code, booking.phoneNumber]
    .map((part) => String(part || "").trim())
    .filter(Boolean)
    .join("");

  return {
    paymentId,
    bookingId: booking.bookingId,
    userId: booking.userId,
    amount: roundedGatewayAmount,
    currency: targetCurrency,
    sourceAmount,
    sourceCurrency,
    exchangeRate: appliedRate,
    description: `LSevin booking ${booking.serviceName || booking.bookingId}`,
    customer: {
      email: booking.email || undefined,
      mobile: mobile || undefined,
    },
    metadata: {
      providerName: booking.providerName,
      serviceName: booking.serviceName,
    },
  };
}

export async function markPaymentRequiresAction(input: {
  paymentId: string;
  authority: string;
  redirectUrl: string;
  payload: unknown;
}): Promise<void> {
  if (!isUuid(input.paymentId)) throw new Error("Invalid payment id.");

  await sql`
    update booking.payments
       set status = 'RequiresAction',
           external_reference = ${input.authority},
           gateway_payload = coalesce(gateway_payload, '{}'::jsonb) || ${jsonb({
             stage: "requires_action",
             authority: input.authority,
             redirectUrl: input.redirectUrl,
             payload: input.payload,
           })}::jsonb,
           updated_at = now()
     where id = ${input.paymentId}::uuid
  `;
}

export async function markPaymentFailed(input: {
  paymentId: string;
  reason: string;
  payload?: unknown;
}): Promise<void> {
  if (!isUuid(input.paymentId)) return;

  // A settled attempt is never re-opened. The gateway callback is a plain GET the
  // customer can replay with any Status they like, and without this qualifier a
  // ?Status=NOK replay flips a Succeeded row back to Failed — after which the next
  // ?Status=OK replay passes the settled-state check in markGatewayPaymentVerified
  // and credits paid_amount a second time. Zarinpal answers 101 ("already
  // verified") on the second verify, so the gateway does not block it either.
  await sql`
    update booking.payments
       set status = 'Failed',
           gateway_payload = coalesce(gateway_payload, '{}'::jsonb) || ${jsonb({
             stage: "failed",
             reason: input.reason,
             payload: input.payload ?? null,
           })}::jsonb,
           updated_at = now()
     where id = ${input.paymentId}::uuid
       and lower(coalesce(status, '')) not in ('succeeded', 'paid', 'captured', 'completed')
  `;
}

export async function getGatewayPaymentByAuthority(input: {
  gateway: PaymentGatewayCode;
  authority: string;
}): Promise<GatewayPaymentRow | null> {
  const authority = String(input.authority || "").trim();
  if (!authority) return null;

  const rows = await sql<GatewayPaymentRow[]>`
    select
      p.id::text as "paymentId",
      p.booking_id::text as "bookingId",
      p.user_id::text as "userId",
      p.amount::text as amount,
      p.currency,
      p.source_amount::text as "sourceAmount",
      p.source_currency_code as "sourceCurrency",
      p.status,
      p.external_reference as "externalReference",
      p.gateway,
      p.gateway_payload as "gatewayPayload"
    from booking.payments p
    where p.gateway = ${input.gateway}
      and p.external_reference = ${authority}
    order by p.updated_at desc nulls last, p.created_at desc
    limit 1
  `;

  return rows[0] ?? null;
}

export async function getGatewayPaymentById(paymentId: string): Promise<GatewayPaymentRow | null> {
  if (!isUuid(paymentId)) return null;

  const rows = await sql<GatewayPaymentRow[]>`
    select
      p.id::text as "paymentId",
      p.booking_id::text as "bookingId",
      p.user_id::text as "userId",
      p.amount::text as amount,
      p.currency,
      p.source_amount::text as "sourceAmount",
      p.source_currency_code as "sourceCurrency",
      p.status,
      p.external_reference as "externalReference",
      p.gateway,
      p.gateway_payload as "gatewayPayload"
    from booking.payments p
    where p.id = ${paymentId}::uuid
    limit 1
  `;

  return rows[0] ?? null;
}

export async function markGatewayPaymentVerified(input: {
  payment: GatewayPaymentRow;
  verification: PaymentVerificationResult;
}): Promise<void> {
  if (!isUuid(input.payment.paymentId) || !isUuid(input.payment.bookingId)) return;

  const referenceId = input.verification.referenceId ? String(input.verification.referenceId) : null;
  const paymentAmount = toNumber(input.payment.amount);
  const sourcePaidAmount = toNumber(input.payment.sourceAmount, paymentAmount);

  // BTCPay settles from two directions at once — the InvoiceSettled webhook and
  // the customer's browser return — so this can run twice within milliseconds
  // for the same invoice. Deciding on the caller's already-read `status` would
  // let both racers see "RequiresAction" and each add to `paid_amount`, double
  // crediting the booking. The transition is therefore the lock: only the
  // statement that actually moves the row out of a non-settled state credits
  // the booking, and it happens in one transaction with the credit.
  //
  // `status` alone is not enough to key that on, because it is mutable and other
  // writers move it backwards (markPaymentFailed above, confirmBookingPayment in
  // booking-pro) — each such write re-arms the credit. `creditedAt` is stamped by
  // the crediting statement and never cleared: every write to gateway_payload in
  // this codebase is a shallow `coalesce(...) || {...}` merge, and the only
  // wholesale writes are inserts of brand-new rows. Keep the status qualifier too,
  // since rows settled before this marker existed carry no `creditedAt`.
  await sql.begin(async (tx) => {
    const transitioned = await tx<{ id: string }[]>`
      update booking.payments
         set status = 'Succeeded',
             gateway_payload = coalesce(gateway_payload, '{}'::jsonb) || ${jsonb({
               stage: "verified",
               verification: input.verification,
               creditedAt: new Date().toISOString(),
             })}::jsonb,
             updated_at = now()
       where id = ${input.payment.paymentId}::uuid
         and lower(coalesce(status, '')) not in ('succeeded', 'paid', 'captured', 'completed')
         and gateway_payload->>'creditedAt' is null
      returning id::text as id
    `;

    if (transitioned.length === 0) {
      // Lost the race (or a replayed webhook). Keep the verification payload for
      // the audit trail, but never touch the booking's paid amount again.
      await tx`
        update booking.payments
           set gateway_payload = coalesce(gateway_payload, '{}'::jsonb) || ${jsonb({
                 stage: "verified_duplicate",
                 verification: input.verification,
               })}::jsonb,
               updated_at = now()
         where id = ${input.payment.paymentId}::uuid
      `;
      return;
    }

    await tx`
      update booking.bookings
         set payment_status = 'Paid',
             payment_method = ${input.payment.gateway || 'zarinpal'},
             payment_reference = coalesce(${referenceId}, payment_reference),
             paid_amount = coalesce(paid_amount, 0) + ${sourcePaidAmount},
             last_modified_date = now(),
             metadata = coalesce(metadata, '{}'::jsonb) || ${jsonb({
               lastPaymentGateway: input.payment.gateway || "zarinpal",
               lastPaymentId: input.payment.paymentId,
               lastPaymentReference: referenceId,
               lastPaymentVerifiedAt: new Date().toISOString(),
             })}::jsonb
       where id = ${input.payment.bookingId}::uuid
    `;

    // Redeeming the reserved coupon belongs here, in the same transaction as the
    // credit. It used to live only in booking-pro's confirmBookingPayment, which is
    // reached from an endpoint nothing calls — so a coupon reserved at checkout and
    // then paid through a gateway stayed 'reserved' forever: never redeemed, never
    // released, and still counted against the customer's allowance. Checkout only
    // ever moves a coupon 'issued' -> 'reserved', so this is the sole transition
    // that closes it out.
    await tx`
      update marketing.user_discount_coupons udc
         set status = 'redeemed',
             redeemed_at = coalesce(redeemed_at, now())
        from booking.bookings b
       where b.id = ${input.payment.bookingId}::uuid
         and b.applied_coupon_id = udc.id
         and udc.status = 'reserved'
    `;
  });
}
