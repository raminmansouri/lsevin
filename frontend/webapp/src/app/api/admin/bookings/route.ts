
import { NextRequest, NextResponse } from 'next/server';
import { listAdminBookings } from '@/features/booking-pro/server/admin-repository';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const items = await listAdminBookings({
    locale: searchParams.get('locale') ?? 'en-US',
    search: searchParams.get('search') ?? '',
    status: searchParams.get('status') ?? '',
    take: Number(searchParams.get('take') ?? 20),
    offset: Number(searchParams.get('offset') ?? 0),
  });

  return NextResponse.json({ items });
}
