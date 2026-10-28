import { expect, test, type BrowserContext, type Page } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import postgres from 'postgres';
import { encode } from 'next-auth/jwt';

/**
 * Landing-page category priority, end to end: the real admin categories page and its server
 * actions, then the real landing page and categories page, against a real local Postgres.
 *
 * The .NET API does not run locally; the admin list's one API read is served by the API stub
 * started by `pnpm test:local-env` (scripts/test-env/api-stub.mjs, E2E_API_STUB_URL). Everything
 * this feature writes or reads for the landing page goes straight to Postgres.
 *
 * Needs E2E_BASE_URL, E2E_DATABASE_URL, E2E_AUTH_SECRET, E2E_API_STUB_URL — all localhost only.
 */

const BASE = process.env.E2E_BASE_URL || 'http://localhost:3140';
const DB_URL = process.env.E2E_DATABASE_URL || '';
const SECRET = process.env.E2E_AUTH_SECRET || '';
const STUB = process.env.E2E_API_STUB_URL || '';
const isLocal = (value: string) => {
  try { return ['localhost', '127.0.0.1', '::1'].includes(new URL(value).hostname); } catch { return false; }
};
const RUNNABLE = Boolean(DB_URL && SECRET && STUB && isLocal(DB_URL) && isLocal(BASE) && isLocal(STUB));
test.skip(!RUNNABLE, 'Run through `pnpm test:local-env` (needs a local database, AUTH_SECRET and the API stub).');

// Production-shaped catalogue ids (GUIDs without RFC version/variant bits).
const catalogId = () => { const p = randomUUID().split('-'); p[2] = `b${p[2].slice(1)}`; p[3] = `2${p[3].slice(1)}`; return p.join('-'); };
// Letters only: the Persian UI renders Latin digits as Persian ones, so names with digits would not
// match the text the test looks for.
const tag = `qa${Date.now().toString(36).replace(/[0-9]/g, (digit) => 'abcdefghij'[Number(digit)])}`;
const cat = {
  alpha: { id: catalogId(), fa: `آلفا ${tag}`, en: `Alpha ${tag}` },
  beta: { id: catalogId(), fa: `بتا ${tag}`, en: `Beta ${tag}` },
  gamma: { id: catalogId(), fa: `گاما ${tag}`, en: `Gamma ${tag}` },
};
const ids = { type: catalogId(), admin: randomUUID(), providers: [catalogId(), catalogId(), catalogId(), catalogId()] };
const sql = RUNNABLE ? postgres(DB_URL, { max: 2, prepare: false }) : null;

async function seed() {
  const s = sql!;
  await s`insert into category.provider_types (id, name_translations, description_translations, is_active, is_addon_only)
          values (${ids.type}, ${s.json({ en: tag })}, '{}', true, false)`;
  for (const c of Object.values(cat)) {
    await s`insert into category.categories (id, name_translations, description_translations, is_active, display_order, display_in_home_page, create_date)
            values (${c.id}, ${s.json({ 'fa-IR': c.fa, fa: c.fa, 'en-US': c.en })}, '{}', true, 0, true, now())`;
  }
  // Alpha has the most providers, so by the old rule (provider count) it would lead.
  const filed: Array<[string, string]> = [[ids.providers[0], cat.alpha.id], [ids.providers[1], cat.alpha.id], [ids.providers[2], cat.beta.id], [ids.providers[3], cat.gamma.id]];
  for (const [providerId, categoryId] of filed) {
    await s`insert into category.service_providers (id, provider_type_id, category_id, name_translations, description_translations, is_active, city, country, email, phone_number_country_code, phone_number)
            values (${providerId}, ${ids.type}, ${categoryId}, ${s.json({ en: tag })}, '{}', true, 'Tehran', 'Iran', 'e2e@example.com', '+98', '9120000000')`;
  }
  // The admin layout loads the signed-in user's profile row.
  await s`insert into identity.asp_net_users (id, first_name, last_name, phone_number_country_code, user_name, normalized_user_name, email, normalized_email, email_confirmed, phone_number, phone_number_confirmed, two_factor_enabled, lockout_enabled, access_failed_count)
          values (${ids.admin}, 'E2E', 'Admin', '98', ${`${tag}-admin`}, ${`${tag}-ADMIN`}, ${`${tag}@example.com`}, ${`${tag.toUpperCase()}@EXAMPLE.COM`}, true, ${`912${Date.now().toString().slice(-7)}`}, true, false, false, 0)`;
  // The one API read the admin list makes.
  const items = Object.values(cat).map((c) => ({ categoryId: c.id, name: c.fa, description: '', parentId: null, parentName: null, imageUrl: null, gradient: null }));
  const body = { items, totalCount: items.length, pageNumber: 1, pageSize: 20, hasPrevious: false, hasNext: false, currentStartIndex: 1, currentEndIndex: items.length, totalPages: 1 };
  const response = await fetch(`${STUB}/__stub/routes`, { method: 'POST', body: JSON.stringify({ method: 'GET', path: '/category-module/admin/categories', body }) });
  if (!response.ok) throw new Error('could not register the categories list with the API stub');
}

async function cleanup() {
  const s = sql;
  if (!s) return;
  await s`delete from category.service_providers where id in ${s(ids.providers)}`;
  await s`delete from category.categories where id in ${s(Object.values(cat).map((c) => c.id))}`;
  await s`delete from category.provider_types where id = ${ids.type}`;
  await s`delete from identity.asp_net_users where id = ${ids.admin}`;
}

async function signIn(context: BrowserContext, roles: string[], userId = ids.admin) {
  const now = Date.now();
  const value = await encode({
    secret: SECRET,
    salt: 'authjs.session-token',
    token: { sub: userId, user: { id: userId, roles, accessToken: 'e2e', accessTokenExpires: now + 3_600_000, refreshTokenExpires: now + 7_200_000 } } as any,
  });
  await context.addCookies([{ name: 'authjs.session-token', value, domain: new URL(BASE).hostname, path: '/', httpOnly: true, sameSite: 'Lax' }]);
}

const priorityOf = async (id: string) => (await sql!`select coalesce(display_order, 0)::int as p, coalesce(display_in_home_page, true) as shown from category.categories where id = ${id}`)[0];

/** The admin data table renders each row twice (desktop table + phone cards, one hidden); use the visible one. */
const visible = (page: Page, testId: string) => page.getByTestId(testId).filter({ visible: true });

async function goto(page: Page, path: string) {
  for (let attempt = 1; ; attempt += 1) {
    try { await page.goto(path, { waitUntil: 'commit' }); return; } catch (error) { if (attempt >= 3) throw error; }
  }
}

/**
 * Waits until an admin page has settled. Every admin data table currently hydrates with a mismatch
 * (its pagination renders "صفحه ۱ از ۱" on the server and "صفحه 1 از 1" in the browser -- not from
 * this feature), and React then rebuilds the table, replacing any input typed in the meantime.
 */
async function settle(page: Page) {
  await page.waitForLoadState('networkidle').catch(() => undefined);
  await page.waitForTimeout(1500);
}

/** Positions of our fixture names in a region's text, in reading order; -1 when absent. */
async function positions(page: Page, testId: string) {
  const text = await page.getByTestId(testId).innerText();
  return Object.fromEntries(Object.entries(cat).map(([key, c]) => [key, text.indexOf(c.fa)])) as Record<keyof typeof cat, number>;
}

test.describe.configure({ mode: 'serial' });
test.beforeAll(async () => { await cleanup(); await seed(); });
test.afterAll(async () => { await cleanup(); await fetch(`${STUB}/__stub/routes`, { method: 'DELETE' }).catch(() => undefined); await sql?.end({ timeout: 5 }); });

test('admin sets priorities and hides a category; the landing page follows', async ({ page, context }) => {
  await signIn(context, ['superadmin', 'admin']);
  // Regression: the landing note's number rendered "۶" on the server and "6" in the browser; the
  // hydration mismatch rebuilt the table and swallowed the first edit.
  const pageErrors: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  await goto(page, '/fa/admin/categories');
  await expect(page.getByTestId('category-landing-note')).toContainText('۶');
  await settle(page);

  // Gamma first, Beta second (typed with Persian digits, saved on Enter and on blur).
  const gamma = visible(page, `category-priority-${cat.gamma.id}`);
  await gamma.fill('۱');
  // The confirmation toast lives ~4 s, and the first server-action call compiles on demand in dev,
  // so watch for the toast from before the save and check the write alongside it.
  const gammaSaved = page.getByText(`اولویت «${cat.gamma.fa}» ذخیره شد.`).waitFor({ timeout: 120_000 });
  await gamma.press('Enter');
  await gammaSaved;
  await expect.poll(async () => (await priorityOf(cat.gamma.id)).p, { timeout: 30_000 }).toBe(1);
  const beta = visible(page, `category-priority-${cat.beta.id}`);
  await beta.fill('2');
  const betaSaved = page.getByText(`اولویت «${cat.beta.fa}» ذخیره شد.`).waitFor({ timeout: 60_000 });
  await beta.blur();
  await betaSaved;
  await expect.poll(async () => (await priorityOf(cat.beta.id)).p).toBe(2);
  expect((await priorityOf(cat.gamma.id)).p).toBe(1);

  // Persisted: a reload shows the saved values.
  await page.reload({ waitUntil: 'commit' });
  await expect(visible(page, `category-priority-${cat.gamma.id}`)).toHaveValue('1');
  await expect(visible(page, `category-priority-${cat.beta.id}`)).toHaveValue('2');
  await expect(visible(page, `category-priority-${cat.alpha.id}`)).toHaveValue('');

  // Landing: Gamma then Beta lead the shelf, ahead of Alpha (which has more providers).
  await goto(page, '/fa/n/app/mobile/home');
  await expect(page.getByTestId('home-categories')).toContainText(cat.gamma.fa);
  let at = await positions(page, 'home-categories');
  expect(at.gamma).toBeGreaterThanOrEqual(0);
  expect(at.gamma).toBeLessThan(at.beta);
  if (at.alpha >= 0) expect(at.beta).toBeLessThan(at.alpha);

  // Hide Gamma from the landing page; it disappears there but keeps its priority.
  await goto(page, '/fa/admin/categories');
  await expect(page.getByTestId('category-landing-note')).toBeVisible();
  await settle(page);
  await visible(page, `category-homepage-${cat.gamma.id}`).click();
  await expect.poll(async () => (await priorityOf(cat.gamma.id)).shown).toBe(false);
  await goto(page, '/fa/n/app/mobile/home');
  await expect(page.getByTestId('home-categories')).toContainText(cat.beta.fa);
  at = await positions(page, 'home-categories');
  expect(at.gamma).toBe(-1);
  expect((await priorityOf(cat.gamma.id)).p).toBe(1);

  // Regression: this feature's own markup hydrates cleanly. The landing note's number ("۶" vs "6")
  // and the priority column's phone-card header (a render function printed as source code) both
  // used to differ between server and client. The table pagination's mismatch is older (see settle).
  const ours = pageErrors.filter((message) => message.includes('Hydration') && (message.includes('category-landing-note') || message.includes('__TURBOPACK__')));
  expect(ours).toEqual([]);
});

test('the categories page uses the same priority order', async ({ page }) => {
  await sql!`update category.categories set display_in_home_page = true where id = ${cat.gamma.id}`;
  await goto(page, '/fa/n/app/mobile/categories');
  await expect(page.locator('body')).toContainText(cat.gamma.fa);
  const text = await page.locator('body').innerText();
  expect(text.indexOf(cat.gamma.fa)).toBeLessThan(text.indexOf(cat.beta.fa));
  expect(text.indexOf(cat.beta.fa)).toBeLessThan(text.indexOf(cat.alpha.fa));
});

test('invalid input is refused and Escape restores; clearing removes the priority', async ({ page, context }) => {
  await signIn(context, ['superadmin', 'admin']);
  await goto(page, '/fa/admin/categories');
  await expect(page.getByTestId('category-landing-note')).toBeVisible();
  await settle(page);
  const beta = visible(page, `category-priority-${cat.beta.id}`);
  await expect(beta).toHaveValue('2');
  await beta.fill('abc');
  await beta.press('Enter');
  await expect(page.getByText('یک عدد صحیح از ۰ تا 999 وارد کنید.').or(page.getByText('یک عدد صحیح از ۰ تا ۹۹۹ وارد کنید.'))).toBeVisible();
  await expect(beta).toHaveAttribute('aria-invalid', 'true');
  await beta.press('Escape');
  await expect(beta).toHaveValue('2');
  expect((await priorityOf(cat.beta.id)).p).toBe(2);

  await beta.fill('');
  const cleared = page.getByText(`اولویت «${cat.beta.fa}» برداشته شد.`).waitFor({ timeout: 60_000 });
  await beta.press('Enter');
  await cleared;
  await expect.poll(async () => (await priorityOf(cat.beta.id)).p).toBe(0);
});

test('a customer cannot open the admin categories page', async ({ page, context }) => {
  await signIn(context, ['customer'], randomUUID());
  await goto(page, '/fa/admin/categories');
  await expect(page.getByTestId('category-landing-note')).toHaveCount(0);
  expect(new URL(page.url()).pathname).not.toMatch(/\/admin\/categories$/);
});
