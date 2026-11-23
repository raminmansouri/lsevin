import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({ auth: vi.fn(), session: vi.fn(), sql: vi.fn() }));
vi.mock('@/lib/auth/api-guard', () => ({
  requireApiUser: mocks.auth,
  isApiAdmin: (auth: { access: { kind: string } }) => auth.access.kind === 'unlimited',
}));
vi.mock('@/lib/auth/session', () => ({ getSession: mocks.session }));
vi.mock('@/config/database/db', () => ({ default: mocks.sql }));
import { GET } from './[id]/route';

const id = '11111111-1111-1111-1111-111111111111';
const request = new NextRequest(`http://localhost/api/media/private/${id}`);
const context = { params: Promise.resolve({ id }) };

describe('private document bytes', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.auth.mockResolvedValue({ userId: 'customer-a', access: { kind: 'none' } });
    mocks.session.mockResolvedValue({ user: { accessToken: 'test-token' } });
    mocks.sql.mockResolvedValue([{ file_url: `CustomerDocument/customer-b/report.pdf`,
      mime_type: 'application/pdf', created_by: 'customer-b' }]);
  });

  it('does not fetch another customer’s file', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    expect((await GET(request, context)).status).toBe(404);
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it('rejects malformed IDs before querying the database', async () => {
    expect((await GET(request, { params: Promise.resolve({ id: '../other' }) })).status).toBe(404);
    expect(mocks.sql).not.toHaveBeenCalled();
  });
});
