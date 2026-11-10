import { expect, test, type BrowserContext, type Page } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import postgres from 'postgres';
import { encode } from 'next-auth/jwt';

/**
 * Shop API for client websites, end to end on a real Next server and real Postgres:
 * admin issues a token in the admin panel -> the client uses it over HTTP to create a product
 * and set its stock -> another seller's token cannot touch it -> the admin approves the product
 * on the review page -> it is live -> the admin revokes the token -> the token stops working.
 * Also: the Persian help page, and a customer cannot open the admin token page.
 *
 * Run through `pnpm test:local-env --suite shop-api` (localhost only).
 */

const BASE = process.env.E2E_BASE_URL || 'http://localhost:3140';
const DB_URL = process.env.E2E_DATABASE_URL || '';
const SECRET = process.env.E2E_AUTH_SECRET || '';
const isLocal = (value: string) => {
  try { return ['localhost', '127.0.0.1', '::1'].includes(new URL(value).hostname); } catch { return false; }
};
const RUNNABLE = Boolean(DB_URL && SECRET && isLocal(DB_URL) && isLocal(BASE));
test.skip(!RUNNABLE, 'Run through `pnpm test:local-env --suite shop-api`.');

const letters = (value: string) => value.replace(/[0-9]/g, (digit) => 'abcdefghij'[Number(digit)]);
const tag = `qa${letters(Date.now().toString(36))}`;
const ids = { admin: randomUUID(), sellerA: randomUUID(), sellerB: randomUUID() };
const sql = RUNNABLE ? postgres(DB_URL, { max: 2, prepare: false }) : null;
const API = `${BASE}/api/shop/v1`;

async function seed() {
  const s = sql!;
  await s`insert into shop.sellers (id, slug, name_translations, is_active) values (${ids.sellerA}::uuid, ${`${tag}-a`}, ${s.json({ fa: `داروخانه ${tag}` })}, true)`;
  await s`insert into shop.sellers (id, slug, name_translations, is_active) values (${ids.sellerB}::uuid, ${`${tag}-b`}, ${s.json({ fa: `فروشگاه ${tag}` })}, true)`;
  await s`insert into identity.asp_net_users (id, first_name, last_name, phone_number_country_code, user_name, normalized_user_name, email, normalized_email, email_confirmed, phone_number, phone_number_confirmed, two_factor_enabled, lockout_enabled, access_failed_count)
          values (${ids.admin}, 'E2E', 'Admin', '98', ${`${tag}-admin`}, ${`${tag}-ADMIN`}, ${`${tag}@example.com`}, ${`${tag.toUpperCase()}@EXAMPLE.COM`}, true, ${`913${Date.now().toString().slice(-7)}`}, true, false, false, 0)`;
}

async function cleanup() {
  const s = sql;
  if (!s) return;
  const sellers = [ids.sellerA, ids.sellerB];
  await s`delete from shop.api_audit_log where seller_id in ${s(sellers)}`;
  await s`delete from shop.offers where seller_id in ${s(sellers)}`;
  await s`delete from shop.products where owner_seller_id in ${s(sellers)}`;
  await s`delete from shop.api_tokens where seller_id in ${s(sellers)}`;
  await s`delete from shop.sellers where id in ${s(sellers)}`;
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

async function goto(page: Page, path: string) {
  for (let attempt = 1; ; attempt += 1) {
    try {
      await page.goto(path, { waitUntil: 'load' });
      // The dev server answers a route it has not compiled yet with its 404 page; retry while it builds.
      const compiling = await page.getByRole('heading', { name: 'This page could not be found.' }).isVisible().catch(() => false);
      if (!compiling || attempt >= 8) return;
      await page.waitForTimeout(5000);
    } catch (error) {
      if (attempt >= 8) throw error;
    }
  }
}

/** Admin pages rebuild once after load (a known hydration mismatch); let them settle before typing. */
async function settle(page: Page) {
  await page.waitForLoadState('networkidle').catch(() => undefined);
  await page.waitForTimeout(1500);
}

async function issueTokenInAdmin(page: Page, name: string, sellerSlug: string, check: string[] = []) {
  await goto(page, '/fa/admin/shop/api-tokens');
  const form = page.getByTestId('api-token-form');
  await expect(form).toBeVisible();
  await settle(page);
  await form.getByRole('textbox').first().fill(name);
  const select = form.getByRole('combobox').first();
  const value = await select.locator('option', { hasText: sellerSlug }).getAttribute('value');
  await select.selectOption(value!);
  for (const scope of check) await form.getByRole('checkbox', { name: new RegExp(scope) }).check();
  await form.getByRole('button', { name: 'ساخت توکن' }).click();
  const secret = page.getByTestId('api-token-secret');
  await expect(secret).toBeVisible({ timeout: 60_000 });
  const token = (await secret.textContent())?.trim() ?? '';
  expect(token).toMatch(/^lsv_[A-Za-z0-9_-]{43}$/);
  await page.getByRole('button', { name: 'کپی کردم، بستن' }).click();
  await expect(secret).toBeHidden();
  return token;
}

test.describe.configure({ mode: 'serial' });
test.beforeAll(async () => { await cleanup(); await seed(); });
test.afterAll(async () => { await cleanup(); await sql?.end({ timeout: 5 }); });

let tokenA = '';
let productId = '';

test('admin issues a token; the client creates a product and sets stock; it waits for review', async ({ page, context, request }) => {
  await signIn(context, ['superadmin', 'admin']);
  tokenA = await issueTokenInAdmin(page, `${tag} سایت داروخانه`, `${tag}-a`);

  // The list shows the token without its secret.
  await page.reload({ waitUntil: 'commit' });
  const row = page.getByTestId('api-token-row').filter({ hasText: `${tag} سایت داروخانه` });
  await expect(row).toBeVisible();
  await expect(row).toContainText(tokenA.slice(0, 12));
  await expect(page.locator('body')).not.toContainText(tokenA);
  const [stored] = await sql!`select count(*)::int as n from shop.api_tokens where token_hash = encode(sha256(convert_to(${tokenA}, 'UTF8')), 'hex')`;
  expect(stored.n).toBe(1);

  const auth = { Authorization: `Bearer ${tokenA}` };
  const me = await request.get(`${API}/me`, { headers: auth });
  expect(me.status()).toBe(200);
  expect((await me.json()).data.seller.id).toBe(ids.sellerA);

  const created = await request.post(`${API}/products`, {
    headers: auth,
    data: { name: { fa: `ویتامین ${tag}` }, shortDescription: { fa: 'شصت کپسول' }, offer: { price: 450000, stockQuantity: 10 } },
  });
  expect(created.status()).toBe(201);
  const product = (await created.json()).data;
  productId = product.id;
  expect(product).toMatchObject({ status: 'draft', review: { status: 'pending' } });

  const offers = await request.get(`${API}/offers?productId=${productId}`, { headers: auth });
  const offer = (await offers.json()).data[0];
  const stock = await request.patch(`${API}/offers/${offer.id}`, { headers: auth, data: { stockQuantity: 7 } });
  expect(stock.status()).toBe(200);
  expect((await stock.json()).data.stockQuantity).toBe(7);

  // Not in the storefront while in review.
  const draftPage = await request.get(`${BASE}/fa/n/app/mobile/shop/product/${product.slug}`);
  expect(await draftPage.text()).not.toContain(`ویتامین ${tag}`);
});

test("another seller's token cannot read, change or delete it", async ({ page, context, request }) => {
  await signIn(context, ['superadmin', 'admin']);
  // Full write/delete permissions, so a 404 below comes from seller isolation, not from a missing scope.
  const tokenB = await issueTokenInAdmin(page, `${tag} فروشگاه دوم`, `${tag}-b`, ['products:delete']);
  const auth = { Authorization: `Bearer ${tokenB}` };
  expect((await request.get(`${API}/products/${productId}`, { headers: auth })).status()).toBe(404);
  expect((await request.patch(`${API}/products/${productId}`, { headers: auth, data: { slug: 'hijack' } })).status()).toBe(404);
  expect((await request.delete(`${API}/products/${productId}`, { headers: auth })).status()).toBe(404);
  expect(((await (await request.get(`${API}/products`, { headers: auth })).json()).total)).toBe(0);
  const [row] = await sql!`select deleted_at, slug from shop.products where id = ${productId}::uuid`;
  expect(row.deleted_at).toBeNull();
  expect(row.slug).not.toBe('hijack');
});

test('admin approves on the review page; the product goes live and the seller sees it approved', async ({ page, context, request }) => {
  await signIn(context, ['superadmin', 'admin']);
  await goto(page, '/fa/admin/shop/api-review');
  const card = page.getByTestId('api-review-product').filter({ hasText: `ویتامین ${tag}` });
  await expect(card).toBeVisible();
  await settle(page);
  await card.getByRole('button', { name: new RegExp(`تأیید و انتشار: ویتامین ${tag}`) }).click();
  await expect.poll(async () => (await sql!`select status::text as s from shop.products where id = ${productId}::uuid`)[0].s, { timeout: 60_000 }).toBe('active');
  await expect(page.getByTestId('api-review-product').filter({ hasText: `ویتامین ${tag}` })).toHaveCount(0);

  const seen = await request.get(`${API}/products/${productId}`, { headers: { Authorization: `Bearer ${tokenA}` } });
  expect((await seen.json()).data).toMatchObject({ status: 'active', review: { status: 'approved' } });

  // An edit of the now-approved product waits for review (202) and shows up on the review page.
  const edit = await request.patch(`${API}/products/${productId}`, { headers: { Authorization: `Bearer ${tokenA}` }, data: { shortDescription: { fa: 'نود کپسول' } } });
  expect(edit.status()).toBe(202);
  await page.reload({ waitUntil: 'commit' });
  await expect(page.getByTestId('api-review-change').filter({ hasText: `ویتامین ${tag}` })).toContainText('نود کپسول');
});

test('admin revokes the token; the client gets 401', async ({ page, context, request }) => {
  await signIn(context, ['superadmin', 'admin']);
  await goto(page, '/fa/admin/shop/api-tokens');
  const row = page.getByTestId('api-token-row').filter({ hasText: `${tag} سایت داروخانه` });
  await expect(row).toBeVisible();
  await settle(page);
  const revoke = row.getByRole('button', { name: /باطل کردن/ });
  await revoke.click();
  await row.getByRole('button', { name: /برای باطل کردن دوباره بزنید/ }).click();
  await expect(row).toContainText('باطل‌شده', { timeout: 60_000 });
  const after = await request.get(`${API}/me`, { headers: { Authorization: `Bearer ${tokenA}` } });
  expect(after.status()).toBe(401);
});

test('the Persian help page explains the API with this site\'s address', async ({ page }) => {
  await goto(page, '/fa/developers/shop-api');
  const guide = page.getByTestId('shop-api-guide');
  await expect(guide).toBeVisible();
  await expect(guide).toHaveAttribute('dir', 'rtl');
  await expect(guide.getByRole('heading', { level: 1 })).toHaveText('راهنمای API فروشگاه السوین');
  await expect(guide).toContainText(`${API}`);
  await expect(guide).toContainText('Authorization: Bearer');
  for (const scope of ['products:read', 'products:write', 'offers:write', 'catalog:read']) await expect(guide).toContainText(scope);
});

test('a customer cannot open the admin token page', async ({ page, context }) => {
  await signIn(context, ['customer'], randomUUID());
  await goto(page, '/fa/admin/shop/api-tokens');
  await page.waitForLoadState('load').catch(() => undefined);
  await expect(page.getByTestId('api-token-form')).toHaveCount(0);
});
