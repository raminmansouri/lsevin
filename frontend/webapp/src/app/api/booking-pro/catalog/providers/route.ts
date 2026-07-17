import { NextRequest, NextResponse } from 'next/server';
import { listProviders } from '@/features/booking-pro/server/repository';

export async function GET(request: NextRequest) {
  const s = request.nextUrl.searchParams;
  const data = await listProviders({
    locale: s.get('locale') ?? 'fa-IR',
    search: s.get('search') ?? '',
    providerTypeId: s.get('providerTypeId') ?? undefined,
    providerId: s.get('providerId') ?? undefined,
    serviceId: s.get('serviceId') ?? undefined,
    serviceDefinitionId: s.get('serviceDefinitionId') ?? undefined,
    specialistId: s.get('specialistId') ?? undefined,
    take: Number(s.get('take') ?? 8),
    offset: Number(s.get('offset') ?? 0),
  });
  return NextResponse.json(data);
}
