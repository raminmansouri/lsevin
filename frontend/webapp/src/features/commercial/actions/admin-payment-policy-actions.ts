'use server';

import { revalidatePath } from 'next/cache';
import { BookingPaymentPolicyFormInput, BookingPaymentPolicyFormSchema } from '../schemas';
import { deleteBookingPaymentPolicy, upsertBookingPaymentPolicy } from '../lib/server/payment-policy-queries';

export async function upsertBookingPaymentPolicyAction(payload: BookingPaymentPolicyFormInput) {
  const input = BookingPaymentPolicyFormSchema.parse(payload);
  const result = await upsertBookingPaymentPolicy({
    policyId: input.policyId,
    name: input.name,
    description: input.description ?? null,
    scopeType: input.scopeType,
    scopeId: input.scopeId ?? null,
    collectionMode: input.collectionMode,
    depositType: input.depositType,
    depositValue: input.depositValue,
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
