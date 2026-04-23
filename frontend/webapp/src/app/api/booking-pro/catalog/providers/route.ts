import { NextRequest, NextResponse } from 'next/server';
import { listProviders } from '@/features/booking-pro/server/repository';

export async function GET(request: NextRequest) {
  const s = request.nextUrl.searchParams;
  const data = await listProviders({
    locale: s.get('locale') ?? 'en-US',
    search: s.get('search') ?? '',
    providerTypeId: s.get('providerTypeId') ?? undefined,
    take: Number(s.get('take') ?? 3),
    offset: Number(s.get('offset') ?? 0),
  });
  return NextResponse.json(data);
}
