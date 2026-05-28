import { NextRequest, NextResponse } from 'next/server';
import { listUploadRequirements } from '@/features/booking-pro/server/repository';

export async function GET(request: NextRequest) {
  const serviceId = request.nextUrl.searchParams.get('serviceId');
  const locale = request.nextUrl.searchParams.get('locale') ?? 'fa-IR';
  if (!serviceId) return NextResponse.json({ error: 'serviceId is required' }, { status: 400 });
  const data = await listUploadRequirements(serviceId, locale);
  return NextResponse.json(data);
}
