'use server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { resolveCurrentUserId } from '../utils/auth';
import { saveBookingToCart, removeBookingFromCart } from '../server/cart.repository';

export async function changeBookingCart(input: unknown) {
  const parsed = z.object({ draftId: z.string().uuid(), action: z.enum(['save', 'remove']) }).parse(input);
  const userId = await resolveCurrentUserId();
  if (!userId) throw new Error('Unauthorized');
  if (parsed.action === 'save') await saveBookingToCart(userId, parsed.draftId);
  else await removeBookingFromCart(userId, parsed.draftId);
  revalidatePath('/[locale]/n/app/mobile/shop/cart', 'page');
  return { ok: true };
}
