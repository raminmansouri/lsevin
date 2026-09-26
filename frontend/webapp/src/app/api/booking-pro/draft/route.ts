import { NextRequest, NextResponse } from 'next/server';
import { abandonActiveDraft, getActiveDraft, getOrCreateActiveDraft, recalculateDraftTotals, saveDraftCaseShare, saveDraftDocuments, upsertMainDraftSelection } from '@/features/booking-pro/server/repository';
import { resolveCurrentUserId } from '@/features/booking-pro/utils/auth';
import { z } from 'zod';

export async function GET(request: NextRequest) {
  const userId = await resolveCurrentUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const draftId = request.nextUrl.searchParams.get('draftId') || undefined;
  if (draftId && !z.string().uuid().safeParse(draftId).success) return NextResponse.json({ error: 'Invalid draft ID' }, { status: 400 });
  const draft = await getActiveDraft(userId, draftId);
  if (draftId && !draft) return NextResponse.json({ error: 'BOOKING_DRAFT_NOT_EDITABLE' }, { status: 404 });
  return NextResponse.json({ draft });
}

export async function POST() {
  const userId = await resolveCurrentUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const draft = await getOrCreateActiveDraft(userId);
  return NextResponse.json({ draft });
}

export async function PATCH(request: NextRequest) {
  const userId = await resolveCurrentUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await request.json();
  if (body.draftId !== undefined && !z.string().uuid().safeParse(body.draftId).success) return NextResponse.json({ error: 'Invalid draft ID' }, { status: 400 });

  if (body.action === 'abandon') {
    await abandonActiveDraft(userId);
    return NextResponse.json({ ok: true });
  }

  if (body.action === 'documents') {
    await saveDraftDocuments(userId, body.draftId, body.documents ?? []);
    const totals = await recalculateDraftTotals(body.draftId);
    return NextResponse.json({ ok: true, totals });
  }

  if (body.action === 'caseShare') {
    await saveDraftCaseShare(userId, body.draftId, body.caseShare ?? null);
    return NextResponse.json({ ok: true });
  }

  const draft = await upsertMainDraftSelection(userId, body);
  const totals = draft.id ? await recalculateDraftTotals(draft.id) : null;
  return NextResponse.json({ draft, totals });
}
