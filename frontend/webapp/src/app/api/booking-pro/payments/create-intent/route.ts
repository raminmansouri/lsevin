
import { NextRequest, NextResponse } from 'next/server';
import { resolveCurrentUserId } from '@/features/booking-pro/utils/auth';
import { createBookingPaymentIntent } from '@/features/booking-pro/server/payment-repository';

export async function POST(request: NextRequest) {
  try {
    const userId = await resolveCurrentUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const result = await createBookingPaymentIntent({
      bookingId: body.bookingId,
      userId,
      paymentMethodCode: body.paymentMethodCode,
      returnUrl: body.returnUrl ?? null,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? 'Failed to create payment intent' }, { status: 500 });
  }
}
