
import { NextRequest, NextResponse } from 'next/server';
import { reviewAdminBooking } from '@/features/booking-pro/server/admin-repository';
import { requireApiAdmin } from '@/lib/auth/api-guard';

type Context = { params: Promise<{ bookingId: string }> };

export async function POST(request: NextRequest, context: Context) {
  try {
    const auth = await requireApiAdmin();
    if (auth instanceof NextResponse) return auth;

    const { bookingId } = await context.params;
    const body = await request.json();
    const result = await reviewAdminBooking({
      bookingId,
      bookingStatus: body.bookingStatus,
      providerNotes: body.providerNotes ?? null,
      childReviews: body.childReviews ?? [],
    });
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? 'Failed to review booking' }, { status: 500 });
  }
}
