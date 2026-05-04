import 'server-only';

import sql from '@/config/database/db';
import type { BookingPaymentPolicyRecord, BookingPaymentTermsRecord } from '../../types';

export async function getBookingPaymentPolicies(params?: { search?: string; scopeType?: string; isActive?: boolean; }) {
  const search = params?.search?.trim() || null;
  return sql<BookingPaymentPolicyRecord[]>`
    with input as (
      select
        ${search}::text as search_text,
        ${params?.scopeType ?? null}::text as scope_type_filter,
        ${params?.isActive ?? null}::boolean as is_active_filter
    )
    select bpp.id,
           bpp.name,
           bpp.description,
           bpp.scope_type as "scopeType",
           bpp.scope_id as "scopeId",
           bpp.collection_mode as "collectionMode",
           bpp.deposit_type as "depositType",
           bpp.deposit_value::float8 as "depositValue",
           bpp.minimum_due_now_amount::float8 as "minimumDueNowAmount",
           bpp.cap_due_now_amount::float8 as "capDueNowAmount",
           bpp.due_now_rounding_mode as "dueNowRoundingMode",
           bpp.balance_due_trigger as "balanceDueTrigger",
           bpp.allow_wallet_for_due_now as "allowWalletForDueNow",
           bpp.allow_gateway_for_due_now as "allowGatewayForDueNow",
           bpp.deposit_refundable_mode as "depositRefundableMode",
           bpp.priority,
           bpp.is_active as "isActive",
           bpp.metadata
    from commercial.booking_payment_policies bpp
    cross join input i
    where (
        i.search_text is null
        or bpp.name ilike ('%' || i.search_text || '%')
        or coalesce(bpp.description, '') ilike ('%' || i.search_text || '%')
      )
      and (i.scope_type_filter is null or bpp.scope_type = i.scope_type_filter)
      and (i.is_active_filter is null or bpp.is_active = i.is_active_filter)
    order by bpp.priority asc, bpp.created_at desc
  `;
}

export async function getBookingPaymentPolicyById(policyId: string) {
  const rows = await sql<BookingPaymentPolicyRecord[]>`
    select id,
           name,
           description,
           scope_type as "scopeType",
           scope_id as "scopeId",
           collection_mode as "collectionMode",
           deposit_type as "depositType",
           deposit_value::float8 as "depositValue",
           minimum_due_now_amount::float8 as "minimumDueNowAmount",
           cap_due_now_amount::float8 as "capDueNowAmount",
           due_now_rounding_mode as "dueNowRoundingMode",
           balance_due_trigger as "balanceDueTrigger",
           allow_wallet_for_due_now as "allowWalletForDueNow",
           allow_gateway_for_due_now as "allowGatewayForDueNow",
           deposit_refundable_mode as "depositRefundableMode",
           priority,
           is_active as "isActive",
           metadata
      from commercial.booking_payment_policies
     where id = ${policyId}
     limit 1
  `;
  return rows[0] ?? null;
}

export async function upsertBookingPaymentPolicy(input: {
  policyId?: string;
  name: string;
  description?: string | null;
  scopeType: string;
  scopeId?: string | null;
  collectionMode: string;
  depositType: string;
  depositValue: number;
  minimumDueNowAmount: number;
  capDueNowAmount?: number | null;
  dueNowRoundingMode: string;
  balanceDueTrigger: string;
  allowWalletForDueNow: boolean;
  allowGatewayForDueNow: boolean;
  depositRefundableMode: string;
  priority: number;
  isActive: boolean;
  metadata: Record<string, unknown>;
}) {
  const normalizedDepositType = input.collectionMode === 'deposit_percent'
    ? 'percent'
    : input.collectionMode === 'deposit_fixed'
      ? 'fixed'
      : 'none';
  const normalizedDepositValue = normalizedDepositType === 'none' ? 0 : input.depositValue;
  const normalizedScopeId = input.scopeType === 'global' ? null : (input.scopeId ?? null);

  const rows = input.policyId
    ? await sql<any[]>`
        update commercial.booking_payment_policies
           set name = ${input.name},
               description = ${input.description ?? null},
               scope_type = ${input.scopeType},
               scope_id = ${normalizedScopeId},
               collection_mode = ${input.collectionMode},
               deposit_type = ${normalizedDepositType},
               deposit_value = ${normalizedDepositValue},
               minimum_due_now_amount = ${input.minimumDueNowAmount},
               cap_due_now_amount = ${input.capDueNowAmount ?? null},
               due_now_rounding_mode = ${input.dueNowRoundingMode},
               balance_due_trigger = ${input.balanceDueTrigger},
               allow_wallet_for_due_now = ${input.allowWalletForDueNow},
               allow_gateway_for_due_now = ${input.allowGatewayForDueNow},
               deposit_refundable_mode = ${input.depositRefundableMode},
               priority = ${input.priority},
               is_active = ${input.isActive},
               metadata = ${input.metadata as any},
               updated_at = now()
         where id = ${input.policyId}
         returning id
      `
    : await sql<any[]>`
        insert into commercial.booking_payment_policies (
          name, description, scope_type, scope_id, collection_mode, deposit_type,
          deposit_value, minimum_due_now_amount, cap_due_now_amount,
          due_now_rounding_mode, balance_due_trigger, allow_wallet_for_due_now,
          allow_gateway_for_due_now, deposit_refundable_mode, priority, is_active, metadata
        ) values (
          ${input.name}, ${input.description ?? null}, ${input.scopeType}, ${normalizedScopeId}, ${input.collectionMode}, ${normalizedDepositType},
          ${normalizedDepositValue}, ${input.minimumDueNowAmount}, ${input.capDueNowAmount ?? null},
          ${input.dueNowRoundingMode}, ${input.balanceDueTrigger}, ${input.allowWalletForDueNow},
          ${input.allowGatewayForDueNow}, ${input.depositRefundableMode}, ${input.priority}, ${input.isActive}, ${input.metadata as any}
        )
        returning id
      `;
  return rows[0];
}

export async function deleteBookingPaymentPolicy(policyId: string) {
  await sql`delete from commercial.booking_payment_policies where id = ${policyId}`;
  return { ok: true };
}

export async function getBookingPaymentTerms(bookingId: string) {
  const [terms] = await sql<any[]>`
    select id,
           draft_id as "draftId",
           booking_id as "bookingId",
           policy_id as "policyId",
           collection_mode as "collectionMode",
           payment_currency_code as "paymentCurrencyCode",
           total_amount::float8 as "totalAmount",
           due_now_amount::float8 as "dueNowAmount",
           due_later_amount::float8 as "dueLaterAmount",
           deposit_percent::float8 as "depositPercent",
           deposit_fixed_amount::float8 as "depositFixedAmount",
           balance_due_trigger as "balanceDueTrigger",
           deposit_refundable_mode as "depositRefundableMode",
           terms_snapshot as "termsSnapshot"
      from commercial.booking_payment_terms
     where booking_id = ${bookingId}
     limit 1
  `;
  if (!terms) return null;
  const schedule = await sql<any[]>`
    select id, line_no, line_type, label, amount::float8 as amount, currency_code, status, metadata
      from commercial.booking_payment_schedule_lines
     where payment_terms_id = ${terms.id}
     order by line_no asc
  `;
  return { ...terms, schedule } as BookingPaymentTermsRecord;
}
