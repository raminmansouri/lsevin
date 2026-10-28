import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import postgres from 'postgres';
import { randomUUID } from 'node:crypto';

/**
 * Real-Postgres checks for landing-page category priority: the landing shelf order
 * (getHomeCategories), the admin priority action, and that an edit-form save through the .NET
 * API (which resets display_order) keeps the priority. Opt-in: needs ACCOUNTING_TEST_DATABASE_URL
 * pointing at a LOCAL database (`pnpm test:local-env` builds one). Fixtures are removed afterwards.
 */

const admin = vi.hoisted(() => ({ isAdmin: true }));
vi.mock('@/lib/auth/admin-guard', () => ({ getAdminContext: vi.fn(async () => ({ isAdmin: admin.isAdmin })) }));
// No Next runtime here: cache invalidation is a no-op, and "use cache" helpers are not involved.
vi.mock('next/cache', () => ({ revalidateTag: vi.fn(), revalidatePath: vi.fn(), unstable_cache: (fn: unknown) => fn }));

const url = process.env.ACCOUNTING_TEST_DATABASE_URL;
const host = url ? new URL(url).hostname : '';
const LOCAL = ['localhost', '127.0.0.1', '::1'].includes(host);
const sql = LOCAL ? postgres(url as string, { max: 2, prepare: false }) : null;
const d = LOCAL ? describe : describe.skip;

// Production-shaped ids: GUIDs without RFC version/variant bits, like most of the real catalogue.
const catalogId = () => { const p = randomUUID().split('-'); p[2] = `b${p[2].slice(1)}`; p[3] = `2${p[3].slice(1)}`; return p.join('-'); };
const tag = `it-landing-${Date.now()}`;
const ids = {
  type: catalogId(),
  first: catalogId(), second: catalogId(), unprioritised: catalogId(), hidden: catalogId(), empty: catalogId(), child: catalogId(),
  providers: [catalogId(), catalogId(), catalogId(), catalogId(), catalogId()],
};

type Repo = {
  getHomeCategories: typeof import('@/features/home/api/server/get-home-page').getHomeCategories;
  setCategoryPriorityAction: typeof import('../actions/set-category-priority').setCategoryPriorityAction;
  readCategoryPriority: typeof import('../db/priority').readCategoryPriority;
  restoreCategoryPriority: typeof import('../db/priority').restoreCategoryPriority;
};
let repo: Repo;

const landingIds = async () => (await repo.getHomeCategories({ locale: 'en' }, 200)).map((row) => row.id);
const priorityOf = async (id: string) => (await sql!`select coalesce(display_order, 0)::int as p from category.categories where id = ${id}`)[0]?.p;

d('landing category priority (real database)', () => {
  beforeAll(async () => {
    const s = sql!;
    await s`insert into category.provider_types (id, name_translations, description_translations, is_active, is_addon_only)
            values (${ids.type}, ${s.json({ en: tag })}, '{}', true, false)`;
    const roots: Array<[string, string, number, boolean]> = [
      [ids.first, 'First', 1, true],
      [ids.second, 'Second', 2, true],
      [ids.unprioritised, 'Unprioritised', 0, true],
      [ids.hidden, 'Hidden', 3, false],
      [ids.empty, 'Empty', 4, true],
    ];
    for (const [id, name, order, shown] of roots) {
      await s`insert into category.categories (id, name_translations, description_translations, is_active, display_order, display_in_home_page, create_date)
              values (${id}, ${s.json({ en: `${tag} ${name}` })}, '{}', true, ${order}, ${shown}, now())`;
    }
    await s`insert into category.categories (id, name_translations, description_translations, is_active, display_order, parent_id, create_date)
            values (${ids.child}, ${s.json({ en: `${tag} Child` })}, '{}', true, 1, ${ids.second}, now())`;
    // Providers: first, unprioritised, hidden directly; second through its child; empty has none.
    const filed: Array<[string, string]> = [
      [ids.providers[0], ids.first], [ids.providers[1], ids.child], [ids.providers[2], ids.unprioritised],
      [ids.providers[3], ids.unprioritised], [ids.providers[4], ids.hidden],
    ];
    for (const [providerId, categoryId] of filed) {
      await s`insert into category.service_providers (id, provider_type_id, category_id, name_translations, description_translations, is_active, city, country, email, phone_number_country_code, phone_number)
              values (${providerId}, ${ids.type}, ${categoryId}, ${s.json({ en: tag })}, '{}', true, 'Tehran', 'Iran', 'it@example.com', '+98', '9120000000')`;
    }
    repo = {
      ...(await import('@/features/home/api/server/get-home-page')),
      ...(await import('../actions/set-category-priority')),
      ...(await import('../db/priority')),
    } as Repo;
  });

  afterAll(async () => {
    if (!sql) return;
    await sql`delete from category.service_providers where id in ${sql(ids.providers)}`;
    await sql`delete from category.categories where id = ${ids.child}`;
    await sql`delete from category.categories where id in ${sql([ids.first, ids.second, ids.unprioritised, ids.hidden, ids.empty])}`;
    await sql`delete from category.provider_types where id = ${ids.type}`;
    await sql.end({ timeout: 5 });
  });

  beforeEach(() => { admin.isAdmin = true; });

  it('shows prioritised categories first in priority order, then the rest; never hidden or empty ones', async () => {
    const order = await landingIds();
    expect(order.slice(0, 2)).toEqual([ids.first, ids.second]);
    expect(order).toContain(ids.unprioritised);
    expect(order.indexOf(ids.unprioritised)).toBeGreaterThan(1);
    expect(order).not.toContain(ids.hidden);   // switched off on the landing page
    expect(order).not.toContain(ids.empty);    // no providers: a card would open an empty page
    expect(order).not.toContain(ids.child);    // only top-level categories are on the landing page
  });

  it('lets an admin reorder: giving the unprioritised category priority 1 moves it to the front', async () => {
    expect(await repo.setCategoryPriorityAction({ categoryId: ids.unprioritised, priority: 1 })).toEqual({ ok: true, priority: 1 });
    await repo.setCategoryPriorityAction({ categoryId: ids.first, priority: 3 });
    expect((await landingIds()).slice(0, 3)).toEqual([ids.unprioritised, ids.second, ids.first]);
  });

  it('clears a priority with null or 0', async () => {
    expect(await repo.setCategoryPriorityAction({ categoryId: ids.unprioritised, priority: null })).toEqual({ ok: true, priority: 0 });
    expect(await priorityOf(ids.unprioritised)).toBe(0);
  });

  it('rejects invalid input, unknown categories and non-admins without writing', async () => {
    const before = await priorityOf(ids.second);
    expect((await repo.setCategoryPriorityAction({ categoryId: ids.second, priority: -1 })).ok).toBe(false);
    expect((await repo.setCategoryPriorityAction({ categoryId: ids.second, priority: 1.5 })).ok).toBe(false);
    expect((await repo.setCategoryPriorityAction({ categoryId: ids.second, priority: 1000 })).ok).toBe(false);
    expect((await repo.setCategoryPriorityAction({ categoryId: 'not-an-id', priority: 1 })).ok).toBe(false);
    expect(await repo.setCategoryPriorityAction({ categoryId: catalogId(), priority: 1 })).toMatchObject({ ok: false, code: 'NOT_FOUND' });
    admin.isAdmin = false;
    expect(await repo.setCategoryPriorityAction({ categoryId: ids.second, priority: 9 })).toMatchObject({ ok: false, code: 'FORBIDDEN' });
    expect(await priorityOf(ids.second)).toBe(before);
  });

  it('keeps the priority through an edit-form save, which the .NET API resets to 0 (regression)', async () => {
    await repo.setCategoryPriorityAction({ categoryId: ids.second, priority: 2 });
    const before = await repo.readCategoryPriority(ids.second);
    await sql!`update category.categories set display_order = 0 where id = ${ids.second}`; // what the API does
    await repo.restoreCategoryPriority(ids.second, before);
    expect(await priorityOf(ids.second)).toBe(2);
    expect(await repo.readCategoryPriority(catalogId())).toBeNull();
  });
});
