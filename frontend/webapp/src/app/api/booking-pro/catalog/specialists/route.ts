import { NextRequest, NextResponse } from 'next/server';
import { listSpecialists } from '@/features/booking-pro/server/repository';

export async function GET(request: NextRequest) {
  const s = request.nextUrl.searchParams;
  const providerId = s.get('providerId');
  const serviceId = s.get('serviceId');
  if (!providerId || !serviceId) return NextResponse.json({ error: 'providerId and serviceId are required' }, { status: 400 });
  const data = await listSpecialists({
    providerId,
    serviceId,
    locale: s.get('locale') ?? 'en-US',
    search: s.get('search') ?? '',
    take: Number(s.get('take') ?? 3),
    offset: Number(s.get('offset') ?? 0),
  });
  return NextResponse.json(data);
}
