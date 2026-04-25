import "server-only";
import { db } from "@/features/booking-admin-shared/server/db";

export async function getCustomers() {
  return db<any[]>`
    select c.*, u.user_name as "userName", u.id as "identityUserId"
    from customer.customers c
    left join identity.asp_net_users u on lower(u.email) = lower(c.email)
    order by c.create_date desc
    limit 300
  `;
}

export async function getCustomerById(customerId: string) {
  const rows = await db<any[]>`
    select c.*, u.id as "identityUserId", u.user_name as "userName", u.user_state as "userState",
      coalesce((select jsonb_agg(jsonb_build_object('id', wa.id, 'defaultCurrency', wa.default_currency, 'isActive', wa.is_active, 'createDate', wa.create_date) order by wa.create_date desc) from customer.wallet_accounts wa where wa.user_id = u.id), '[]'::jsonb) as wallets,
      coalesce((select jsonb_agg(jsonb_build_object('id', wpi.id, 'intentType', wpi.intent_type, 'paymentMethod', wpi.payment_method, 'currencyCode', wpi.currency_code, 'amount', wpi.amount, 'status', wpi.status, 'bookingId', wpi.booking_id, 'createDate', wpi.create_date) order by wpi.create_date desc) from customer.wallet_payment_intents wpi where wpi.user_id = u.id), '[]'::jsonb) as payment_intents,
      coalesce((select jsonb_agg(jsonb_build_object('id', wt.id, 'transactionType', wt.transaction_type, 'direction', wt.direction, 'status', wt.status, 'currencyCode', wt.currency_code, 'amount', wt.amount, 'bookingId', wt.booking_id, 'occurredAt', wt.occurred_at, 'title', wt.title) order by wt.occurred_at desc) from customer.wallet_transactions wt where wt.user_id = u.id), '[]'::jsonb) as wallet_transactions,
      coalesce((select jsonb_agg(jsonb_build_object('id', cd.id, 'documentTypeId', cd.document_type_id, 'documentUrl', cd.document_url, 'createDate', cd.create_date) order by cd.create_date desc) from customer.customer_documents cd where cd.customer_id = c.id), '[]'::jsonb) as documents
    from customer.customers c
    left join identity.asp_net_users u on lower(u.email) = lower(c.email)
    where c.id = ${customerId}
    limit 1
  `;
  return rows[0] ?? null;
}
