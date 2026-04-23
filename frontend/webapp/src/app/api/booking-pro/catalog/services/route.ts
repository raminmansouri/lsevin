import { NextRequest, NextResponse } from 'next/server';
import { listServices } from '@/features/booking-pro/server/repository';

export async function GET(request: NextRequest) {
  const s = request.nextUrl.searchParams;
  const providerId = s.get('providerId');
  if (!providerId) return NextResponse.json({ error: 'providerId is required' }, { status: 400 });
  const data = await listServices({
    providerId,
    locale: s.get('locale') ?? 'en-US',
    search: s.get('search') ?? '',
    take: Number(s.get('take') ?? 3),
    offset: Number(s.get('offset') ?? 0),
  });
  return NextResponse.json(data);
}
