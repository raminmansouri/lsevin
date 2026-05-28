import { NextRequest, NextResponse } from 'next/server';
import { applyDraftCoupon, removeDraftCoupon } from '@/features/booking-pro/server/repository';
import { resolveCurrentUserId } from '@/features/booking-pro/utils/auth';

export async function POST(request: NextRequest) {
  try {
    const userId = await resolveCurrentUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const result = await applyDraftCoupon(userId, body.draftId, body.couponCode ?? body.code);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? 'Failed to apply coupon' }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = await resolveCurrentUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const result = await removeDraftCoupon(userId, body.draftId);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? 'Failed to remove coupon' }, { status: 400 });
  }
}
