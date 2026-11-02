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
    query.mockResolvedValueOnce([]).mockResolvedValueOnce([{ id: 'id', slug: null }]);
    expect(await resolvePublicEntity('package', 'missing-package')).toBeNull();
    expect(await resolvePublicEntity('package', '30000000-0000-4000-8000-000000000001')).toEqual({ id: 'id', slug: null });
  });
});
