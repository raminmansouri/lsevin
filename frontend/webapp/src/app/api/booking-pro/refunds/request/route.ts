import { NextRequest, NextResponse } from 'next/server';
import { resolveCurrentUserId } from '@/features/booking-pro/utils/auth';
import { requestBookingRefund } from '@/features/refunds/server/repository';

export async function POST(request: NextRequest) {
  try {
    const userId = await resolveCurrentUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const result = await requestBookingRefund({
      bookingId: body.bookingId,
      userId,
      reason: body.reason || 'Customer requested refund',
      customerNote: body.customerNote ?? null,
      refundScope: body.refundScope === 'partial' ? 'partial' : 'full',
    });

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? 'Unable to request refund.' }, { status: 500 });
  }
}
