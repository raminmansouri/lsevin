import { NextRequest, NextResponse } from 'next/server';
import { recalculateDraftTotals, saveChildDraft } from '@/features/booking-pro/server/repository';
import { resolveCurrentUserId } from '@/features/booking-pro/utils/auth';

export async function POST(request: NextRequest) {
  const userId = await resolveCurrentUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await request.json();
  const row = await saveChildDraft(userId, body.draftId, body.child);
  const totals = await recalculateDraftTotals(body.draftId);
  return NextResponse.json({ item: row, totals });
}
