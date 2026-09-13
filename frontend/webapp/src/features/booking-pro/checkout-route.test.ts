import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const { checkoutDraft, resolveCurrentUserId } = vi.hoisted(() => ({
  checkoutDraft: vi.fn(),
  resolveCurrentUserId: vi.fn(),
}));
vi.mock('@/features/booking-pro/server/repository', () => ({ checkoutDraft }));
vi.mock('@/features/booking-pro/utils/auth', () => ({ resolveCurrentUserId }));

import { POST } from '@/app/api/booking-pro/checkout/route';

const request = () => new NextRequest('http://localhost/api/booking-pro/checkout', {
  method: 'POST',
  body: JSON.stringify({ draftId: 'draft-a', paymentMethod: 'manual' }),
});

describe('booking checkout route', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    resolveCurrentUserId.mockResolvedValue('customer-a');
  });

  it('returns a conflict when a submitted or cancelled draft is checked out again', async () => {
    checkoutDraft.mockRejectedValue(new Error('BOOKING_DRAFT_NOT_EDITABLE'));
    const response = await POST(request());
    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ error: 'BOOKING_DRAFT_NOT_EDITABLE' });
  });

  it('uses the authenticated customer for checkout', async () => {
    checkoutDraft.mockResolvedValue({ bookingId: 'booking-a' });
    const response = await POST(request());
    expect(response.status).toBe(200);
    expect(checkoutDraft).toHaveBeenCalledWith('customer-a', {
      draftId: 'draft-a', paymentMethod: 'manual',
    });
  });

  it('does not run checkout for an unauthenticated request', async () => {
    resolveCurrentUserId.mockResolvedValue(null);
    expect((await POST(request())).status).toBe(401);
    expect(checkoutDraft).not.toHaveBeenCalled();
  });
});
