import "server-only";

import sql from "@/config/database/db";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{12}$/i;
const isUuid = (v?: string | null): v is string => typeof v === "string" && UUID_RE.test(v.trim());

// postgres.js `sql.json` has a strict JSONValue signature; our payloads are
// arbitrary provider responses. One narrow cast, in one place.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const j = (value: unknown) => sql.json((value ?? {}) as any);

const ZERO_DECIMAL = new Set(["IRR", "IRT", "JPY", "KRW", "VND"]);
export function roundGatewayAmount(amount: number, currency: string): number {
  const c = String(currency || "").toUpperCase();
  return ZERO_DECIMAL.has(c) ? Math.round(amount) : Math.round(amount * 100) / 100;
}

export type ShopOrderPaymentBase = {
  orderId: string;
  orderNumber: string;
  customerId: string | null;
  email: string;
  status: string;
  paymentStatus: string;
  grandTotal: number;
  currency: string;
  paymentCurrency: string;
  paymentTotal: number;
};

export async function getOrderForPayment(orderId: string): Promise<ShopOrderPaymentBase | null> {
  if (!isUuid(orderId)) return null;
  const rows = await sql<any[]>`
    select
      o.id::text as "orderId", o.order_number as "orderNumber", o.customer_id::text as "customerId",
      o.email, o.status, o.payment_status as "paymentStatus",
      o.grand_total::float as "grandTotal", o.currency,
      coalesce(o.payment_currency, o.currency) as "paymentCurrency",
      coalesce(o.payment_total, o.grand_total)::float as "paymentTotal"
    from shop.orders o where o.id = ${orderId}::uuid limit 1
  `;
  return rows[0] ?? null;
}

export async function getOrderByNumberForPayment(orderNumber: string): Promise<ShopOrderPaymentBase | null> {
  const rows = await sql<any[]>`
    select
      o.id::text as "orderId", o.order_number as "orderNumber", o.customer_id::text as "customerId",
      o.email, o.status, o.payment_status as "paymentStatus",
      o.grand_total::float as "grandTotal", o.currency,
      coalesce(o.payment_currency, o.currency) as "paymentCurrency",
      coalesce(o.payment_total, o.grand_total)::float as "paymentTotal"
    from shop.orders o where o.order_number = ${orderNumber} limit 1
  `;
  return rows[0] ?? null;
}

export async function createPaymentTransaction(input: {
  orderId: string;
  paymentMethodId?: string | null;
  provider: string;
  amount: number;
  currency: string;
  type: "charge" | "manual";
  requestPayload?: unknown;
}): Promise<string> {
  const rows = await sql<{ id: string }[]>`
    insert into shop.payment_transactions
      (order_id, payment_method_id, provider, amount, currency, status, type, request_payload)
    values
      (${input.orderId}::uuid, ${input.paymentMethodId ?? null}::uuid, ${input.provider},
       ${roundGatewayAmount(input.amount, input.currency)}, ${input.currency.toUpperCase()},
       'pending', ${input.type}, ${j(input.requestPayload)})
    returning id::text as id
  `;
  return rows[0].id;
}

export async function attachProviderReference(input: {
  transactionId: string;
  providerTransactionId: string;
  responsePayload?: unknown;
}): Promise<void> {
  await sql`
    update shop.payment_transactions
    set provider_transaction_id = ${input.providerTransactionId},
        response_payload = coalesce(response_payload, '{}'::jsonb) || ${j(input.responsePayload)},
        last_modified_date = now()
    where id = ${input.transactionId}::uuid
  `;
}

export async function markTransactionFailed(input: { transactionId: string; reason: string; payload?: unknown }): Promise<void> {
  await sql`
    update shop.payment_transactions
    set status = 'failed', failed_at = now(),
        response_payload = coalesce(response_payload, '{}'::jsonb) || ${j({ reason: input.reason, payload: input.payload ?? null })},
        last_modified_date = now()
    where id = ${input.transactionId}::uuid
      and status not in ('captured','refunded','partially_refunded')
  `;
}

export type GatewayTxnRow = {
  transactionId: string;
  orderId: string;
  orderNumber: string;
  amount: number;
  currency: string;
  status: string;
  provider: string | null;
  providerTransactionId: string | null;
};

export async function findTransactionByProviderRef(provider: string, providerTransactionId: string): Promise<GatewayTxnRow | null> {
  const ref = String(providerTransactionId || "").trim();
  if (!ref) return null;
  const rows = await sql<any[]>`
    select
      t.id::text as "transactionId", t.order_id::text as "orderId", o.order_number as "orderNumber",
      t.amount::float as amount, t.currency, t.status, t.provider, t.provider_transaction_id as "providerTransactionId"
    from shop.payment_transactions t
    join shop.orders o on o.id = t.order_id
    where t.provider = ${provider} and t.provider_transaction_id = ${ref}
    order by t.create_date desc limit 1
  `;
  return rows[0] ?? null;
}

/**
 * Settles a payment exactly once (SHP-PAY-006/008, SHP-NFR-004). The state
 * transition on the transaction row is the lock: only the statement that moves
 * it out of a non-settled status also flips the order to paid, both in one
 * transaction. Replayed callbacks/webhooks land in the "duplicate" branch and
 * touch nothing financial.
 */
export async function settlePaymentOnce(input: {
  transactionId: string;
  orderId: string;
  referenceId: string | null;
  verificationPayload: unknown;
  manualReview: boolean;
}): Promise<{ applied: boolean }> {
  return sql.begin(async (tx) => {
    const moved = await tx<{ id: string }[]>`
      update shop.payment_transactions
      set status = 'captured', captured_at = now(),
          provider_transaction_id = coalesce(${input.referenceId}, provider_transaction_id),
          response_payload = coalesce(response_payload, '{}'::jsonb) || ${j({ stage: "verified", verification: input.verificationPayload, settledAt: new Date().toISOString() })},
          last_modified_date = now()
      where id = ${input.transactionId}::uuid
        and status not in ('captured','refunded','partially_refunded')
      returning id::text as id
    `;
    if (moved.length === 0) {
      await tx`
        update shop.payment_transactions
        set response_payload = coalesce(response_payload, '{}'::jsonb) || ${j({ stage: "verified_duplicate" })}, last_modified_date = now()
        where id = ${input.transactionId}::uuid
      `;
      return { applied: false };
    }

    const nextStatus = "paid";
    await tx`
      update shop.orders
      set payment_status = 'captured',
          status = ${nextStatus},
          review_status = case when ${input.manualReview} then 'pending'::shop.order_review_status else review_status end,
          paid_at = coalesce(paid_at, now()),
          last_modified_date = now(),
          meta = coalesce(meta, '{}'::jsonb) || ${j({ lastPaymentReference: input.referenceId, paidAt: new Date().toISOString() })}
      where id = ${input.orderId}::uuid
    `;
    await tx`
      insert into shop.order_status_history (order_id, from_status, to_status, note)
      values (${input.orderId}::uuid, 'awaiting_payment', ${nextStatus}, 'Payment captured')
    `;
    return { applied: true };
  });
}
