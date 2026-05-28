import { NextRequest, NextResponse } from 'next/server';
import { checkoutDraft } from '@/features/booking-pro/server/repository';
import { resolveCurrentUserId } from '@/features/booking-pro/utils/auth';

export async function POST(request: NextRequest) {
  const userId = await resolveCurrentUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await request.json();
  const result = await checkoutDraft(userId, body);
  return NextResponse.json(result);
}
