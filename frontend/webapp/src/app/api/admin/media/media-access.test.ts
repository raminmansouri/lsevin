import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

const mocks = vi.hoisted(() => ({ requireApiUser: vi.fn(), getMediaById: vi.fn(), listMedia: vi.fn() }));
vi.mock('@/lib/auth/api-guard', () => ({
  requireApiUser: mocks.requireApiUser,
  isApiAdmin: (auth: { access: { kind: string } }) => auth.access.kind === 'unlimited',
  requireApiAdmin: vi.fn(),
}));
vi.mock('@/components/media/server/repository', () => ({
  getMediaById: mocks.getMediaById, listMedia: mocks.listMedia,
  createMedia: vi.fn(), bulkDeleteMedia: vi.fn(), getMediaFileUrls: vi.fn(),
  updateMedia: vi.fn(), deleteMedia: vi.fn(),
}));
vi.mock('@/components/media/server/storage-delete', () => ({ deleteStoredObject: vi.fn(), deleteStoredObjects: vi.fn() }));
vi.mock('@/lib/auth/session', () => ({ getSession: vi.fn() }));

import { GET as getItem } from './[id]/route';
import { GET as listItems } from './route';

const request = new NextRequest('http://localhost/api/admin/media');
const customer = { userId: 'customer-a', roles: [], access: { kind: 'none' } };

describe('customer media ownership', () => {
  beforeEach(() => { vi.resetAllMocks(); mocks.requireApiUser.mockResolvedValue(customer); });

  it('filters the picker library to the signed-in owner', async () => {
    mocks.listMedia.mockResolvedValue({ items: [], total: 0 });
    await listItems(request);
    expect(mocks.listMedia).toHaveBeenCalledWith(expect.anything(), undefined, 'customer-a');
  });

  it('does not disclose another customer’s media by ID', async () => {
    mocks.getMediaById.mockResolvedValue({ id: 'file-a', createdBy: 'customer-b', isPublic: false });
    const response = await getItem(request, { params: Promise.resolve({ id: 'file-a' }) });
    expect(response.status).toBe(404);
  });

  it('lets an administrator inspect the same item', async () => {
    mocks.requireApiUser.mockResolvedValue({ ...customer, access: { kind: 'unlimited' } });
    mocks.getMediaById.mockResolvedValue({ id: 'file-a', createdBy: 'customer-b', isPublic: false });
    const response = await getItem(request, { params: Promise.resolve({ id: 'file-a' }) });
    expect(response.status).toBe(200);
  });

  it('requires a session before querying media', async () => {
    mocks.requireApiUser.mockResolvedValue(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
    expect((await listItems(request)).status).toBe(401);
    expect(mocks.listMedia).not.toHaveBeenCalled();
  });
});
