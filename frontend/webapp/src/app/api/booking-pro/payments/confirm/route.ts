import { NextRequest, NextResponse } from 'next/server';

import { confirmBookingPayment } from '@/features/booking-pro/server/payment-repository';
import { resolveCurrentUserId } from '@/features/booking-pro/utils/auth';

/**
 * Client-reported outcome of a redirect-based payment attempt.
 *
 * This used to take bookingId/paymentId/status straight off the request body with no
 * authentication of any kind — `/api/**` is excluded from the middleware matcher, so
 * nothing gated it. Anyone who could guess or read a booking/payment id pair could POST
 * status:'succeeded' and flip a booking to Paid/Confirmed, bump paid_amount and burn its
 * reserved coupon, without paying. Its two siblings (create-intent, methods) already
 * authenticate; this one was simply missed.
 *
 * Two changes close it. The caller must be signed in and must own the booking (enforced
 * in confirmBookingPayment's lookup). And a client can no longer assert settlement at
 * all: a payment reaches Succeeded only through the gateway callback or the
 * HMAC-verified BTCPay webhook, both of which re-read the invoice from the gateway
 * before crediting anything. What is left for this endpoint is what it is actually for —
 * a client reporting that its redirect came back failed or cancelled.
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await resolveCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const claimed = String(body?.status ?? '').trim().toLowerCase();
    if (['succeeded', 'success', 'captured', 'paid'].includes(claimed)) {
      return NextResponse.json(
        { error: 'Payment settlement is confirmed by the gateway, not by the client.' },
        { status: 403 }
      );
    }

    const result = await confirmBookingPayment({
      bookingId: String(body?.bookingId ?? ''),
      paymentId: String(body?.paymentId ?? ''),
      userId,
      status: String(body?.status ?? ''),
      externalReference: body?.externalReference ?? null,
      payload: body?.payload ?? undefined,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? 'Failed to confirm payment' }, { status: 500 });
  }
}
