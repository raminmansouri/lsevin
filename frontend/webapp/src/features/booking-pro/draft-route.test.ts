import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
const mocks = vi.hoisted(() => ({ getActiveDraft: vi.fn(), resolveCurrentUserId: vi.fn() }));
vi.mock('@/features/booking-pro/server/repository', () => ({
  getActiveDraft: mocks.getActiveDraft, abandonActiveDraft: vi.fn(), getOrCreateActiveDraft: vi.fn(),
  recalculateDraftTotals: vi.fn(), saveDraftDocuments: vi.fn(), upsertMainDraftSelection: vi.fn(),
}));
vi.mock('@/features/booking-pro/utils/auth', () => ({ resolveCurrentUserId: mocks.resolveCurrentUserId }));
import { GET } from '@/app/api/booking-pro/draft/route';
const draftId = 'ad39af13-147e-4c62-b142-ae527dc64e13';

describe('reopening a saved booking', () => {
  beforeEach(() => { vi.resetAllMocks(); mocks.resolveCurrentUserId.mockResolvedValue('customer-a'); });
  it('selects the requested draft using the authenticated owner', async () => {
    mocks.getActiveDraft.mockResolvedValue({ id: draftId });
    const response = await GET(new NextRequest(`http://localhost/api/booking-pro/draft?draftId=${draftId}`));
    expect(mocks.getActiveDraft).toHaveBeenCalledWith('customer-a', draftId);
    expect(await response.json()).toEqual({ draft: { id: draftId } });
  });
  it('does not fall back to another draft when the requested one is inaccessible', async () => {
    mocks.getActiveDraft.mockResolvedValue(null);
    const response = await GET(new NextRequest(`http://localhost/api/booking-pro/draft?draftId=${draftId}`));
    expect(response.status).toBe(404);
    expect(mocks.getActiveDraft).toHaveBeenCalledTimes(1);
  });
  it('rejects malformed IDs before reading the database', async () => {
    expect((await GET(new NextRequest('http://localhost/api/booking-pro/draft?draftId=invalid'))).status).toBe(400);
    expect(mocks.getActiveDraft).not.toHaveBeenCalled();
  });
  it('retains default active-draft loading for a new booking visit', async () => {
    mocks.getActiveDraft.mockResolvedValue(null);
    expect((await GET(new NextRequest('http://localhost/api/booking-pro/draft'))).status).toBe(200);
    expect(mocks.getActiveDraft).toHaveBeenCalledWith('customer-a', undefined);
  });
  it('requires authentication before reading a saved booking', async () => {
    mocks.resolveCurrentUserId.mockResolvedValue(null);
    expect((await GET(new NextRequest(`http://localhost/api/booking-pro/draft?draftId=${draftId}`))).status).toBe(401);
    expect(mocks.getActiveDraft).not.toHaveBeenCalled();
  });
});
