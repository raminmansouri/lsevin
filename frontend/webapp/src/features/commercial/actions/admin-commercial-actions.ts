'use server';

import { revalidatePath } from 'next/cache';
import sql from '@/config/database/db';
import { approveRefundRequest, createRefundRequest, executeRefundRequest, rejectRefundRequest } from '../lib/server/refund-engine';
import { CompensationPolicyFormInput, CompensationPolicyFormSchema, RefundRequestInput, RefundRequestSchema } from '../schemas';

export async function upsertCompensationPolicyAction(payload: CompensationPolicyFormInput) {
  const input = CompensationPolicyFormSchema.parse(payload);
  const rows = input.policyId
    ? await sql<any[]>`
        update commercial.compensation_policies
           set name = ${input.name},
               description = ${input.description ?? null},
               scope_type = ${input.scopeType},
               scope_id = ${input.scopeId ?? null},
               applies_to = ${input.appliesTo},
               fee_mode = ${input.feeMode},
               platform_percent = ${input.platformPercent},
               platform_fixed_amount = ${input.platformFixedAmount},
               minimum_platform_amount = ${input.minimumPlatformAmount},
               provider_percent_override = ${input.providerPercentOverride ?? null},
               gateway_fee_mode = ${input.gatewayFeeMode},
               currency_code = ${input.currencyCode ?? null},
               priority = ${input.priority},
               is_active = ${input.isActive},
               effective_from = ${input.effectiveFrom ?? null},
               effective_to = ${input.effectiveTo ?? null},
               metadata = ${input.metadata as any},
               updated_at = now()
         where id = ${input.policyId}
         returning id
      `
    : await sql<any[]>`
        insert into commercial.compensation_policies (
          name, description, scope_type, scope_id, applies_to, fee_mode,
          platform_percent, platform_fixed_amount, minimum_platform_amount,
          provider_percent_override, gateway_fee_mode, currency_code,
          priority, is_active, effective_from, effective_to, metadata
        ) values (
          ${input.name}, ${input.description ?? null}, ${input.scopeType}, ${input.scopeId ?? null}, ${input.appliesTo}, ${input.feeMode},
          ${input.platformPercent}, ${input.platformFixedAmount}, ${input.minimumPlatformAmount},
          ${input.providerPercentOverride ?? null}, ${input.gatewayFeeMode}, ${input.currencyCode ?? null},
          ${input.priority}, ${input.isActive}, ${input.effectiveFrom ?? null}, ${input.effectiveTo ?? null}, ${input.metadata as any}
        )
        returning id
      `;

  revalidatePath('/admin/commercial/policies');
  return rows[0];
}

export async function deleteCompensationPolicyAction(policyId: string) {
  await sql`delete from commercial.compensation_policies where id = ${policyId}`;
  revalidatePath('/admin/commercial/policies');
  return { ok: true };
}

export async function createRefundRequestAction(payload: RefundRequestInput) {
  const input = RefundRequestSchema.parse(payload);
  const created = await createRefundRequest(input);
  revalidatePath('/admin/commercial/refund-requests');
  revalidatePath(`/admin/bookings/${input.bookingId}/financial`);
  return created;
}

export async function approveRefundRequestAction(refundRequestId: string, adminUserId?: string | null, adminNote?: string | null) {
  const result = await approveRefundRequest(refundRequestId, adminUserId, adminNote);
  revalidatePath('/admin/commercial/refund-requests');
  revalidatePath(`/admin/commercial/refund-requests/${refundRequestId}`);
  return result;
}

export async function rejectRefundRequestAction(refundRequestId: string, adminUserId?: string | null, adminNote?: string | null) {
  const result = await rejectRefundRequest(refundRequestId, adminUserId, adminNote);
  revalidatePath('/admin/commercial/refund-requests');
  revalidatePath(`/admin/commercial/refund-requests/${refundRequestId}`);
  return result;
}

export async function executeRefundRequestAction(refundRequestId: string, adminUserId?: string | null) {
  const result = await executeRefundRequest(refundRequestId, adminUserId);
  revalidatePath('/admin/commercial/refund-requests');
  revalidatePath(`/admin/commercial/refund-requests/${refundRequestId}`);
  return result;
}

export async function updateProviderLedgerStatusAction(input: { ledgerId: string; status: 'pending' | 'approved' | 'paid' | 'cancelled'; notes?: string | null; }) {
  const rows = await sql<any[]>`
    update commercial.provider_ledgers
       set status = ${input.status},
           notes = coalesce(${input.notes ?? null}, notes),
           updated_at = now()
     where id = ${input.ledgerId}
     returning id, status
  `;
  revalidatePath('/admin/commercial/provider-ledgers');
  return rows[0];
}
