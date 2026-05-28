import { NextRequest, NextResponse } from 'next/server';
import { getBookingAvailableDatesFromDb } from '@/features/booking-pro/server/booking-availability.repository';

export async function GET(request: NextRequest) {
  try {
    const s = request.nextUrl.searchParams;
    const data = await getBookingAvailableDatesFromDb({
      locale: s.get('locale') ?? 'fa-IR',
      calendar: s.get('calendar') ?? undefined,
      providerId: s.get('providerId') ?? undefined,
      serviceId: s.get('serviceId') ?? undefined,
      specialistId: s.get('specialistId') ?? undefined,
      startDate: s.get('startDate') ?? undefined,
      endDate: s.get('endDate') ?? undefined,
    });
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? 'Unable to load available dates.' }, { status: 500 });
  }
}
