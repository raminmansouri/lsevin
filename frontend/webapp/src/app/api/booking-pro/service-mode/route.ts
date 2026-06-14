import { NextRequest, NextResponse } from 'next/server';
import { getServiceMode } from '@/features/booking-pro/server/repository';

export async function GET(request: NextRequest) {
  const serviceId = request.nextUrl.searchParams.get('serviceId');
  if (!serviceId) return NextResponse.json({ error: 'serviceId is required' }, { status: 400 });
  const item = await getServiceMode(serviceId);
  return NextResponse.json({ item });
}
