import { NextRequest, NextResponse } from 'next/server';
import { abandonActiveDraft, getActiveDraft, getOrCreateActiveDraft, recalculateDraftTotals, saveDraftDocuments, upsertMainDraftSelection } from '@/features/booking-pro/server/repository';
import { resolveCurrentUserId } from '@/features/booking-pro/utils/auth';

export async function GET() {
  const userId = await resolveCurrentUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const draft = await getActiveDraft(userId);
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

  if (body.action === 'abandon') {
    await abandonActiveDraft(userId);
    return NextResponse.json({ ok: true });
  }

  if (body.action === 'documents') {
    await saveDraftDocuments(userId, body.draftId, body.documents ?? []);
    const totals = await recalculateDraftTotals(body.draftId);
    return NextResponse.json({ ok: true, totals });
  }

  const draft = await upsertMainDraftSelection(userId, body);
  const totals = draft.id ? await recalculateDraftTotals(draft.id) : null;
  return NextResponse.json({ draft, totals });
}
