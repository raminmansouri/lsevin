import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const { saveChildDraft, deleteChildDraft, recalculateDraftTotals, resolveCurrentUserId, ChildBookingError } = vi.hoisted(() => {
  class ChildBookingError extends Error {
    constructor(public readonly code: string) { super(code); }
  }
  return {
    saveChildDraft: vi.fn(),
    deleteChildDraft: vi.fn(),
    recalculateDraftTotals: vi.fn(),
    resolveCurrentUserId: vi.fn(),
    ChildBookingError,
  };
});
vi.mock('@/features/booking-pro/server/repository', () => ({ saveChildDraft, deleteChildDraft, recalculateDraftTotals, ChildBookingError }));
vi.mock('@/features/booking-pro/utils/auth', () => ({ resolveCurrentUserId }));

import { DELETE, POST } from '@/app/api/booking-pro/child-booking/route';

const DRAFT = '11111111-1111-4111-8111-111111111111';
// Catalog ids shaped like production's: most lack RFC version/variant bits (TYPE is the real hotel
// provider type id). Drafts and their children come from uuid_generate_v4 and are RFC-valid.
const TYPE = '019eb710-abaa-bbe5-2703-75d6e772c57f';
const PROVIDER = '019ec153-df7a-d42d-37cb-7e03495fa3a5';
const SPECIALIST = '019eb728-bff1-caa4-2a6f-93c969d58846';
const SERVICE = '44444444-4444-4444-8444-444444444444';
const CHILD = '55555555-5555-4555-8555-555555555555';

const child = (over: Record<string, unknown> = {}) => ({
  providerTypeId: TYPE, providerId: PROVIDER, serviceId: SERVICE, bookingUiMode: 'default_slot',
  selectedDate: '2026-11-05', selectedTimeFrom: '10:00', selectedTimeTo: '11:00', adults: 2, ...over,
});
const post = (body: unknown) => new NextRequest('http://localhost/api/booking-pro/child-booking', { method: 'POST', body: typeof body === 'string' ? body : JSON.stringify(body) });
const del = (body: unknown) => new NextRequest('http://localhost/api/booking-pro/child-booking', { method: 'DELETE', body: JSON.stringify(body) });

describe('child-booking route', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    resolveCurrentUserId.mockResolvedValue('customer-a');
    recalculateDraftTotals.mockResolvedValue({ totalAmount: 10 });
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  it('saves for the signed-in customer and returns the new row and totals', async () => {
    saveChildDraft.mockResolvedValue({ id: CHILD });
    const response = await POST(post({ draftId: DRAFT, child: child() }));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ item: { id: CHILD }, totals: { totalAmount: 10 } });
    expect(saveChildDraft).toHaveBeenCalledWith('customer-a', DRAFT, expect.objectContaining({ providerTypeId: TYPE, serviceId: SERVICE }));
  });

  it('accepts production catalog ids that are GUIDs but not RFC UUIDs (regression)', async () => {
    saveChildDraft.mockResolvedValue({ id: CHILD });
    const response = await POST(post({ draftId: DRAFT, child: child({ specialistId: SPECIALIST, serviceDefinitionId: TYPE }) }));
    expect({ status: response.status, body: response.status === 200 ? null : await response.clone().json() }).toEqual({ status: 200, body: null });
    expect(saveChildDraft).toHaveBeenCalledWith('customer-a', DRAFT, expect.objectContaining({ providerTypeId: TYPE, providerId: PROVIDER, specialistId: SPECIALIST }));
  });

  it('still rejects ids that are not GUIDs at all', async () => {
    for (const bad of ['019eb710abaabbe5270375d6e772c57f', '019eb710-abaa-bbe5-2703-75d6e772c57', 'not-an-id', '']) {
      expect((await POST(post({ draftId: DRAFT, child: child({ providerTypeId: bad }) }))).status).toBe(400);
    }
    expect(saveChildDraft).not.toHaveBeenCalled();
  });

  it('never forwards client-side prices or display fields to the repository', async () => {
    saveChildDraft.mockResolvedValue({ id: CHILD });
    await POST(post({ draftId: DRAFT, child: child({ subtotalAmount: 1, currency: 'XXX', providerNameTranslations: { fa: 'x' } }) }));
    const forwarded = saveChildDraft.mock.calls[0][2];
    expect(forwarded).not.toHaveProperty('subtotalAmount');
    expect(forwarded).not.toHaveProperty('currency');
    expect(forwarded).not.toHaveProperty('providerNameTranslations');
  });

  it('rejects unauthenticated requests without touching the draft', async () => {
    resolveCurrentUserId.mockResolvedValue(null);
    expect((await POST(post({ draftId: DRAFT, child: child() }))).status).toBe(401);
    expect((await DELETE(del({ draftId: DRAFT, childId: CHILD }))).status).toBe(401);
    expect(saveChildDraft).not.toHaveBeenCalled();
    expect(deleteChildDraft).not.toHaveBeenCalled();
  });

  it.each([
    ['malformed JSON', '{not json'],
    ['missing service', { draftId: DRAFT, child: child({ serviceId: undefined }) }],
    ['non-uuid draft', { draftId: 'draft-a', child: child() }],
    ['bad time', { draftId: DRAFT, child: child({ selectedTimeFrom: '25:00' }) }],
    ['zero-night stay', { draftId: DRAFT, child: child({ bookingUiMode: 'date_range', selectedDateFrom: '2026-11-05', selectedDateTo: '2026-11-05' }) }],
    ['check-out before check-in', { draftId: DRAFT, child: child({ selectedDateFrom: '2026-11-06', selectedDateTo: '2026-11-05' }) }],
    ['negative guests', { draftId: DRAFT, child: child({ adults: -1 }) }],
  ])('returns 400 for %s', async (_label, body) => {
    const response = await POST(post(body));
    expect(response.status).toBe(400);
    expect((await response.json()).error).toBe('VALIDATION_ERROR');
    expect(saveChildDraft).not.toHaveBeenCalled();
  });

  it.each([
    ['ADDON_NOT_ALLOWED', 422],
    ['INVALID_SELECTION', 422],
    ['CHILD_NOT_FOUND', 404],
  ])('maps %s to %i', async (code, status) => {
    saveChildDraft.mockRejectedValue(new ChildBookingError(code));
    const response = await POST(post({ draftId: DRAFT, child: child({ id: CHILD }) }));
    expect(response.status).toBe(status);
    expect(await response.json()).toEqual({ error: code });
  });

  it('returns 409 for a draft that is no longer editable', async () => {
    saveChildDraft.mockRejectedValue(new Error('BOOKING_DRAFT_NOT_EDITABLE'));
    expect((await POST(post({ draftId: DRAFT, child: child() }))).status).toBe(409);
  });

  it('keeps infrastructure failures as 500 instead of a validation message, and logs them', async () => {
    saveChildDraft.mockRejectedValue(new Error('connect ECONNREFUSED'));
    const response = await POST(post({ draftId: DRAFT, child: child() }));
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: 'UNEXPECTED_ERROR' });
    expect(console.error).toHaveBeenCalled();
  });

  it('deletes one child of the customer\'s draft and returns fresh totals', async () => {
    deleteChildDraft.mockResolvedValue({ id: CHILD });
    const response = await DELETE(del({ draftId: DRAFT, childId: CHILD }));
    expect(response.status).toBe(200);
    expect(deleteChildDraft).toHaveBeenCalledWith('customer-a', DRAFT, CHILD);
    expect(await response.json()).toEqual({ ok: true, totals: { totalAmount: 10 } });
  });

  it('returns 404 when deleting a child that is not in the draft, 400 for a bad id', async () => {
    deleteChildDraft.mockRejectedValue(new ChildBookingError('CHILD_NOT_FOUND'));
    expect((await DELETE(del({ draftId: DRAFT, childId: CHILD }))).status).toBe(404);
    expect((await DELETE(del({ draftId: DRAFT, childId: 'x' }))).status).toBe(400);
  });
});
