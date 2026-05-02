import { NextRequest, NextResponse } from 'next/server';
import { getBookingDateRangeAvailabilityFromDb } from '@/features/booking-pro/server/booking-availability.repository';

export async function GET(request: NextRequest) {
  try {
    const s = request.nextUrl.searchParams;
    const data = await getBookingDateRangeAvailabilityFromDb({
      startDate: s.get('startDate') ?? undefined,
      endDate: s.get('endDate') ?? undefined,
      providerId: s.get('providerId') ?? undefined,
      serviceId: s.get('serviceId') ?? undefined,
      requestedUnits: Number(s.get('requestedUnits') || s.get('rooms') || 1),
    });
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? 'Unable to check date range availability.' }, { status: 500 });
  }
}
