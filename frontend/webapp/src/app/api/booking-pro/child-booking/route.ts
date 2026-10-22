import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { ChildBookingError, deleteChildDraft, recalculateDraftTotals, saveChildDraft } from '@/features/booking-pro/server/repository';
import { resolveCurrentUserId } from '@/features/booking-pro/utils/auth';

// Ids are checked as GUIDs (8-4-4-4-12 hex), not RFC UUIDs: most catalog ids in production (provider
// types, providers, service definitions, staff) were generated without RFC version/variant bits, and
// z.string().uuid() rejects them -- every add-on save failed with VALIDATION_ERROR.
const id = z.guid();
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const clockTime = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/);
const count = z.number().int().min(0).max(50);

const childSchema = z.object({
  id: id.optional(),
  providerTypeId: id,
  providerId: id,
  serviceId: id,
  serviceDefinitionId: id.optional(),
  specialistId: id.nullish(),
  bookingUiMode: z.enum(['default_slot', 'date_range', 'custom_form']).optional(),
  requiresSpecialist: z.boolean().optional(),
  selectedDate: isoDate.nullish(),
  selectedDateFrom: isoDate.nullish(),
  selectedDateTo: isoDate.nullish(),
  selectedTime: clockTime.nullish(),
  selectedTimeFrom: clockTime.nullish(),
  selectedTimeTo: clockTime.nullish(),
  adults: count.nullish(),
  children: count.nullish(),
  infants: count.nullish(),
  rooms: count.nullish(),
  formSubmissionId: id.nullish(),
  metadata: z.record(z.string(), z.unknown()).nullish(),
}).refine((child) => !child.selectedDateFrom || !child.selectedDateTo || child.selectedDateTo >= child.selectedDateFrom, {
  message: 'selectedDateTo must not be before selectedDateFrom',
  path: ['selectedDateTo'],
}).refine((child) => child.bookingUiMode !== 'date_range' || !child.selectedDateFrom || !child.selectedDateTo || child.selectedDateTo > child.selectedDateFrom, {
  message: 'A stay needs at least one night',
  path: ['selectedDateTo'],
});

const postSchema = z.object({ draftId: id, child: childSchema });
const deleteSchema = z.object({ draftId: id, childId: id });

const CHILD_ERROR_STATUS: Record<ChildBookingError['code'], number> = {
  CHILD_NOT_FOUND: 404,
  ADDON_NOT_ALLOWED: 422,
  INVALID_SELECTION: 422,
};

/** Known, customer-fixable failures become 4xx; anything else is logged and stays a 500. */
function errorResponse(error: unknown, action: string) {
  if (error instanceof ChildBookingError) {
    return NextResponse.json({ error: error.code }, { status: CHILD_ERROR_STATUS[error.code] });
  }
  if (error instanceof Error && error.message === 'BOOKING_DRAFT_NOT_EDITABLE') {
    return NextResponse.json({ error: 'BOOKING_DRAFT_NOT_EDITABLE' }, { status: 409 });
  }
  console.error(`booking-pro child-booking ${action} failed`, error);
  return NextResponse.json({ error: 'UNEXPECTED_ERROR' }, { status: 500 });
}

async function readJson(request: NextRequest) {
  try {
    return await request.json();
  } catch {
    return undefined;
  }
}

export async function POST(request: NextRequest) {
  const userId = await resolveCurrentUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const parsed = postSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return NextResponse.json({ error: 'VALIDATION_ERROR', issues: parsed.error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message })) }, { status: 400 });
  }
  try {
    const { draftId, child } = parsed.data;
    const row = await saveChildDraft(userId, draftId, child as any);
    const totals = await recalculateDraftTotals(draftId);
    return NextResponse.json({ item: row, totals });
  } catch (error) {
    return errorResponse(error, 'save');
  }
}

export async function DELETE(request: NextRequest) {
  const userId = await resolveCurrentUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const parsed = deleteSchema.safeParse(await readJson(request));
  if (!parsed.success) return NextResponse.json({ error: 'VALIDATION_ERROR' }, { status: 400 });
  try {
    const { draftId, childId } = parsed.data;
    await deleteChildDraft(userId, draftId, childId);
    const totals = await recalculateDraftTotals(draftId);
    return NextResponse.json({ ok: true, totals });
  } catch (error) {
    return errorResponse(error, 'delete');
  }
}
