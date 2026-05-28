
import { NextResponse } from 'next/server';
import { resolveCurrentUserId } from '@/features/booking-pro/utils/auth';
import { listPaymentMethodsForUser } from '@/features/booking-pro/server/payment-repository';

export async function GET() {
  const userId = await resolveCurrentUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const items = await listPaymentMethodsForUser(userId);
  return NextResponse.json({ items });
}
