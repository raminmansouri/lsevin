
import { NextRequest, NextResponse } from 'next/server';
import { getAdminBookingDetail } from '@/features/booking-pro/server/admin-repository';
import { requireApiAdmin } from '@/lib/auth/api-guard';

type Context = { params: Promise<{ bookingId: string }> };

export async function GET(request: NextRequest, context: Context) {
  const auth = await requireApiAdmin();
  if (auth instanceof NextResponse) return auth;

  const { bookingId } = await context.params;
  const { searchParams } = new URL(request.url);
  const item = await getAdminBookingDetail(bookingId, searchParams.get('locale') ?? 'fa-IR');
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ item });
}
