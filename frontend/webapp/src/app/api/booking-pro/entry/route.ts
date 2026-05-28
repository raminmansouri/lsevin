import { NextRequest, NextResponse } from 'next/server';
import { resolveBookingEntry } from '@/features/booking-pro/server/booking-entry.repository';

export async function GET(request: NextRequest) {
  try {
    const s = request.nextUrl.searchParams;
    const data = await resolveBookingEntry({
      locale: s.get('locale') ?? 'fa-IR',
      providerId: s.get('providerId') ?? s.get('id') ?? undefined,
      serviceId: s.get('serviceId') ?? undefined,
      specialistId: s.get('specialistId') ?? undefined,
    });
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? 'Unable to resolve booking entry.' }, { status: 500 });
  }
}
