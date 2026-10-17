import { NextRequest, NextResponse } from 'next/server';
import { listUploadRequirements } from '@/features/booking-pro/server/repository';
import { toStoredLocale } from '@/features/booking-pro/lib/stored-locale';

export async function GET(request: NextRequest) {
  const serviceId = request.nextUrl.searchParams.get('serviceId');
  const locale = toStoredLocale(request.nextUrl.searchParams.get('locale'));
  if (!serviceId) return NextResponse.json({ error: 'serviceId is required' }, { status: 400 });
  const data = await listUploadRequirements(serviceId, locale);
  return NextResponse.json(data);
}
