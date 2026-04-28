'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createRefundRequest } from '@/features/commercial/lib/server/refund-engine';
import { getProviderChargeLinesForRefund } from '../server/repository';

const ProviderRefundSchema = z.object({
  providerId: z.string().uuid(),
  bookingId: z.string().uuid(),
  paymentId: z.string().uuid().optional().nullable(),
  reason: z.string().min(3),
  providerNote: z.string().optional().nullable(),
  selectedChargeLineIds: z.array(z.string().uuid()).min(1),
});

export async function createProviderRefundRequestAction(payload: z.infer<typeof ProviderRefundSchema>) {
  const input = ProviderRefundSchema.parse(payload);
  const chargeLines = await getProviderChargeLinesForRefund(input.providerId, input.bookingId);
  const selected = chargeLines.filter((line) => input.selectedChargeLineIds.includes(line.id));
  if (selected.length === 0) throw new Error('No provider charge lines were selected for refund.');

  const created = await createRefundRequest({
    bookingId: input.bookingId,
    paymentId: input.paymentId ?? null,
    requestedByUserId: null,
    refundScope: 'partial',
    reason: input.reason,
    customerNote: input.providerNote ?? null,
    adminNote: 'Requested from provider panel',
    refundLines: selected.map((line) => ({
      chargeLineId: line.id,
      bookingChildId: line.booking_child_id,
      bookingAddonId: line.booking_addon_id,
      lineType: line.line_type,
      quantity: line.quantity ?? 1,
      paymentRefundAmount: Number(line.net_amount ?? 0),
    })),
  });

  revalidatePath(`/provider-panel/providers/${input.providerId}/commercial`);
  revalidatePath(`/provider-panel/providers/${input.providerId}/commercial/refunds`);
  revalidatePath(`/provider-panel/providers/${input.providerId}/commercial/bookings/${input.bookingId}/financial`);
  return created;
}
