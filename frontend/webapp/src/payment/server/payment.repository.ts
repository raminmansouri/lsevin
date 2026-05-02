import "server-only";

import sql from "@/config/database/db";
import type { PaymentAttempt, PaymentGatewayCode, PaymentVerificationResult } from "../types";

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
  targetCurrency: "IRR" | "IRT";
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
      common.get_translation_t(sp.name_translations, ${input.locale || "en-US"}, 'en-US') as "providerName",
      coalesce(
        nullif(common.get_translation_t(ps.display_name_translations, ${input.locale || "en-US"}, 'en-US'), ''),
        nullif(common.get_translation_t(sd.name_translations, ${input.locale || "en-US"}, 'en-US'), ''),
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
  const targetCurrency = normalizeCurrency(input.targetCurrency) as "IRR" | "IRT";

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

  const roundedGatewayAmount = Math.round(targetAmount);
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

  const mobile = [booking.phoneCountryCode, booking.phoneNumber]
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

export async function markGatewayPaymentVerified(input: {
  payment: GatewayPaymentRow;
  verification: PaymentVerificationResult;
}): Promise<void> {
  if (!isUuid(input.payment.paymentId) || !isUuid(input.payment.bookingId)) return;

  const currentStatus = String(input.payment.status || "").trim().toLowerCase();
  const wasAlreadySucceeded = ["succeeded", "paid", "captured", "completed"].includes(currentStatus);
  const referenceId = input.verification.referenceId ? String(input.verification.referenceId) : null;
  const paymentAmount = toNumber(input.payment.amount);
  const sourcePaidAmount = toNumber(input.payment.sourceAmount, paymentAmount);

  await sql`
    update booking.payments
       set status = 'Succeeded',
           external_reference = external_reference,
           gateway_payload = coalesce(gateway_payload, '{}'::jsonb) || ${jsonb({
             stage: "verified",
             verification: input.verification,
           })}::jsonb,
           updated_at = now()
     where id = ${input.payment.paymentId}::uuid
  `;

  if (!wasAlreadySucceeded) {
    await sql`
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
  }
}
