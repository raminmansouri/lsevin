
import { NextResponse } from 'next/server';
import { resolveCurrentUserId } from '@/features/booking-pro/utils/auth';
import { listPaymentMethodsForUser } from '@/features/booking-pro/server/payment-repository';

export async function GET(request: Request) {
  const userId = await resolveCurrentUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const locale = new URL(request.url).searchParams.get('locale') || 'fa-IR';
  const items = await listPaymentMethodsForUser(userId, locale);
  return NextResponse.json({ items });
}
