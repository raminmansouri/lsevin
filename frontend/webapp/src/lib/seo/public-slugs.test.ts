import { beforeEach, describe, expect, it, vi } from 'vitest';

const query = vi.hoisted(() => vi.fn());
vi.mock('server-only', () => ({}));
vi.mock('@/config/database/db', () => ({ default: query }));
vi.mock('react', async (importOriginal) => {
  const original = await importOriginal<typeof import('react')>();
  return { ...original, cache: (fn: unknown) => fn };
});

import { isPublicSlug, isPublicUuid, resolvePublicEntity } from './public-slugs';

beforeEach(() => query.mockReset());

describe('public slug resolution', () => {
  it('rejects malformed inputs before reaching the database', async () => {
    expect(isPublicSlug('valid-slug')).toBe(true);
    expect(isPublicSlug('Upper_Slug')).toBe(false);
    expect(isPublicUuid('30000000-0000-4000-8000-000000000001')).toBe(true);
    expect(isPublicUuid('019c84d7-13e4-46cd-f1e6-65cbeabfc407')).toBe(true);
    expect(await resolvePublicEntity('provider', '../admin')).toBeNull();
    expect(await resolvePublicEntity('provider', 'x'.repeat(201))).toBeNull();
    expect(query).not.toHaveBeenCalled();
  });

  it('uses fixed tables and active-record filters for slugs and UUIDs', async () => {
    query.mockResolvedValue([{ id: '30000000-0000-4000-8000-000000000001', slug: 'clinic-a' }]);
    expect(await resolvePublicEntity('provider', 'clinic-a')).toEqual({
      id: '30000000-0000-4000-8000-000000000001', slug: 'clinic-a',
    });
    expect(query.mock.calls[0][0].join('?')).toContain('category.service_providers where slug = ? and is_active = true');
    expect(await resolvePublicEntity('provider', '30000000-0000-4000-8000-000000000001')).toHaveProperty('slug', 'clinic-a');
    expect(query.mock.calls[1][0].join('?')).toContain('where id = ?::uuid and is_active = true');
  });

  it('does not invent a slug for a missing or unslugged record', async () => {
    // slug miss, the history table name, the history miss, then the UUID lookup
    query.mockResolvedValueOnce([]).mockReturnValueOnce('t').mockResolvedValueOnce([]).mockResolvedValueOnce([{ id: 'id', slug: null }]);
    expect(await resolvePublicEntity('package', 'missing-package')).toBeNull();
    expect(await resolvePublicEntity('package', '30000000-0000-4000-8000-000000000001')).toEqual({ id: 'id', slug: null });
  });

  it('resolves a previous slug to the record, so its page can redirect to the current one', async () => {
    query.mockImplementation((strings: unknown) =>
      Array.isArray(strings)
        ? Promise.resolve(strings.join('?').includes('public_slug_history') ? [{ id: 'p1', slug: 'clinic-zibaei' }] : [])
        : strings,
    );
    expect(await resolvePublicEntity('provider', 'klynyk-zybayy')).toEqual({ id: 'p1', slug: 'clinic-zibaei' });
    const history = query.mock.calls.find((call) => Array.isArray(call[0]) && call[0].join('?').includes('public_slug_history'));
    expect(history?.slice(1)).toEqual(['category.service_providers', 'provider', 'klynyk-zybayy']);
  });

  it('never looks up the history for a UUID', async () => {
    query.mockResolvedValue([]);
    expect(await resolvePublicEntity('provider', '30000000-0000-4000-8000-000000000001')).toBeNull();
    expect(query).toHaveBeenCalledTimes(1);
  });
});
