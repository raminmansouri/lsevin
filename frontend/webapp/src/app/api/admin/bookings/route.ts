
import { NextRequest, NextResponse } from 'next/server';
import { listAdminBookings } from '@/features/booking-pro/server/admin-repository';
import { requireApiAdmin } from '@/lib/auth/api-guard';

export async function GET(request: NextRequest) {
  const auth = await requireApiAdmin();
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(request.url);
  const items = await listAdminBookings({
    locale: searchParams.get('locale') ?? 'fa-IR',
    search: searchParams.get('search') ?? '',
    status: searchParams.get('status') ?? '',
    take: Number(searchParams.get('take') ?? 20),
    offset: Number(searchParams.get('offset') ?? 0),
  });

  return NextResponse.json({ items });
}
