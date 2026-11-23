import { NextRequest, NextResponse } from 'next/server';
import { checkoutDraft } from '@/features/booking-pro/server/repository';
import { resolveCurrentUserId } from '@/features/booking-pro/utils/auth';

export async function POST(request: NextRequest) {
  const userId = await resolveCurrentUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await request.json();
  try {
    const result = await checkoutDraft(userId, body);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && ['BOOKING_DRAFT_NOT_EDITABLE', 'BOOKING_SLOT_PASSED'].includes(error.message)) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    throw error;
  }
}
