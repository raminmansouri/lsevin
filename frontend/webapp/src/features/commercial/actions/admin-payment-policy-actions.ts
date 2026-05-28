'use server';

import { revalidatePath } from 'next/cache';
import { BookingPaymentPolicyFormInput, BookingPaymentPolicyFormSchema } from '../schemas';
import { deleteBookingPaymentPolicy, upsertBookingPaymentPolicy } from '../lib/server/payment-policy-queries';

export async function upsertBookingPaymentPolicyAction(payload: BookingPaymentPolicyFormInput) {
  const input = BookingPaymentPolicyFormSchema.parse(payload);
  const normalizedDepositType = input.collectionMode === 'deposit_percent'
    ? 'percent'
    : input.collectionMode === 'deposit_fixed'
      ? 'fixed'
      : 'none';
  const normalizedScopeId = input.scopeType === 'global' ? null : (input.scopeId ?? null);

  const result = await upsertBookingPaymentPolicy({
    policyId: input.policyId,
    name: input.name,
    description: input.description ?? null,
    scopeType: input.scopeType,
    scopeId: normalizedScopeId,
    collectionMode: input.collectionMode,
    depositType: normalizedDepositType,
    depositValue: normalizedDepositType === 'none' ? 0 : input.depositValue,
    minimumDueNowAmount: input.minimumDueNowAmount,
    capDueNowAmount: input.capDueNowAmount ?? null,
    dueNowRoundingMode: input.dueNowRoundingMode,
    balanceDueTrigger: input.balanceDueTrigger,
    allowWalletForDueNow: input.allowWalletForDueNow,
    allowGatewayForDueNow: input.allowGatewayForDueNow,
    depositRefundableMode: input.depositRefundableMode,
    priority: input.priority,
    isActive: input.isActive,
    metadata: input.metadata,
  });

  revalidatePath('/admin/commercial/payment-policies');
  return result;
}

export async function deleteBookingPaymentPolicyAction(policyId: string) {
  await deleteBookingPaymentPolicy(policyId);
  revalidatePath('/admin/commercial/payment-policies');
  return { ok: true };
}
