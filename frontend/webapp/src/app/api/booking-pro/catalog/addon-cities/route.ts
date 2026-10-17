import { NextRequest, NextResponse } from 'next/server';
import { listProviderCities } from '@/features/booking-pro/server/repository';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(request: NextRequest) {
  const providerTypeId = request.nextUrl.searchParams.get('providerTypeId') ?? '';
  if (!UUID_RE.test(providerTypeId)) {
    return NextResponse.json({ error: 'providerTypeId must be a UUID' }, { status: 400 });
  }
  try {
    return NextResponse.json({ cities: await listProviderCities(providerTypeId) });
  } catch (error) {
    console.error('addon-cities: lookup failed', { providerTypeId, error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: 'Could not load cities' }, { status: 500 });
  }
}
