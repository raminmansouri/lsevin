import { NextRequest, NextResponse } from 'next/server';
import { getBookingAvailableTimeSlotsFromDb } from '@/features/booking-pro/server/booking-availability.repository';

export async function GET(request: NextRequest) {
  try {
    const s = request.nextUrl.searchParams;
    const data = await getBookingAvailableTimeSlotsFromDb({
      locale: s.get('locale') ?? 'en-US',
      selectedDate: s.get('selectedDate') ?? undefined,
      providerId: s.get('providerId') ?? undefined,
      serviceId: s.get('serviceId') ?? undefined,
      specialistId: s.get('specialistId') ?? undefined,
    });
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? 'Unable to load available time slots.' }, { status: 500 });
  }
}
