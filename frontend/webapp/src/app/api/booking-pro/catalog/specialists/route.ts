import { NextRequest, NextResponse } from 'next/server';
import { listSpecialists } from '@/features/booking-pro/server/repository';

export async function GET(request: NextRequest) {
  const s = request.nextUrl.searchParams;
  const providerId = s.get('providerId') ?? undefined;
  const serviceId = s.get('serviceId') ?? undefined;
  const specialistId = s.get('specialistId') ?? undefined;

  if (!providerId && !serviceId && !specialistId) {
    return NextResponse.json({ error: 'providerId, serviceId, or specialistId is required' }, { status: 400 });
  }

  const data = await listSpecialists({
    providerId,
    serviceId,
    specialistId,
    locale: s.get('locale') ?? 'fa-IR',
    search: s.get('search') ?? '',
    take: Number(s.get('take') ?? 3),
    offset: Number(s.get('offset') ?? 0),
  });
  return NextResponse.json(data);
}
