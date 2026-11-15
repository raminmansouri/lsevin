import { expect, test, type BrowserContext, type Page } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import postgres from 'postgres';
import { encode } from 'next-auth/jwt';

/**
 * Per-domain settings, end to end on a real Next server, real Postgres and a Zibal stub, on three
 * test domains (Chromium resolves *.localhost to this machine):
 *
 *  - Enamad: the admin pastes a domain's Enamad code -> that domain's footer shows it, the others
 *    keep theirs -> refresh keeps it -> replace -> remove. Bad input and non-admins are refused.
 *  - Zibal: the admin enters a token per domain (a new domain without a token is refused) ->
 *    a customer tops up the wallet on site-b -> the bank page -> back to site-b, verified with
 *    site-b's token -> balance credited. Site-c (no token) is never offered Zibal. Cancel at the
 *    bank leaves the balance unchanged.
 *
 * Run through `pnpm test:local-env --suite domain-settings` (localhost only).
 */

const CONFIGURED = new URL(process.env.E2E_BASE_URL || 'http://localhost:3140');
const DB_URL = process.env.E2E_DATABASE_URL || '';
const SECRET = process.env.E2E_AUTH_SECRET || '';
const ZIBAL = process.env.E2E_ZIBAL_STUB_URL || '';
const isLocal = (value: string) => {
  try { return ['localhost', '127.0.0.1', '::1'].includes(new URL(value).hostname); } catch { return false; }
};
const RUNNABLE = Boolean(DB_URL && SECRET && ZIBAL && isLocal(DB_URL) && isLocal(CONFIGURED.toString()));
test.skip(!RUNNABLE, 'Run through `pnpm test:local-env --suite domain-settings`.');

function on(host: string) {
  const url = new URL(CONFIGURED.toString());
  url.hostname = host;
  return url.origin;
}
const SITE_A = on('site-a.localhost');
const SITE_B = on('site-b.localhost');
const SITE_C = on('site-c.localhost');

const tag = `qa${Date.now().toString(36)}`;
const ids = { admin: randomUUID(), customer: randomUUID() };
const sql = RUNNABLE ? postgres(DB_URL, { max: 2, prepare: false }) : null;
type GatewayRow = { code: string; is_enabled: boolean; sort_order: number; settings: unknown };
let savedGateways: GatewayRow[] = [];

const TOKEN_A = `zibal-site-a-${tag}`;
const TOKEN_B = `zibal-site-b-${tag}`;

async function user(id: string, first: string) {
  await sql!`insert into identity.asp_net_users (id, first_name, last_name, phone_number_country_code, user_name, normalized_user_name, email, normalized_email, email_confirmed, phone_number, phone_number_confirmed, two_factor_enabled, lockout_enabled, access_failed_count)
             values (${id}, ${first}, 'E2E', 'IR', ${`${tag}-${first}`}, ${`${tag}-${first}`.toUpperCase()}, ${`${tag}-${first}@example.com`}, ${`${tag}-${first}@EXAMPLE.COM`.toUpperCase()}, true, ${`0912${Math.floor(1e6 + Math.random() * 8e6)}`}, true, false, false, 0)`;
}

async function signIn(context: BrowserContext, roles: string[], userId: string) {
  const now = Date.now();
  const value = await encode({
    secret: SECRET,
    salt: 'authjs.session-token',
    token: { sub: userId, user: { id: userId, roles, accessToken: 'e2e', accessTokenExpires: now + 3_600_000, refreshTokenExpires: now + 7_200_000 } } as any,
  });
  // Sessions are host cookies: one per test domain.
  await context.addCookies(
    ['site-a.localhost', 'site-b.localhost', 'site-c.localhost'].map((domain) => ({ name: 'authjs.session-token', value, domain, path: '/', httpOnly: true, sameSite: 'Lax' as const }))
  );
}

async function goto(page: Page, url: string) {
  for (let attempt = 1; ; attempt += 1) {
    try {
      await page.goto(url, { waitUntil: 'load' });
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
  await page.waitForTimeout(2500);
}

async function footerSeal(page: Page, origin: string) {
  await page.setViewportSize({ width: 1366, height: 900 });
  await goto(page, `${origin}/fa/categories`);
  await expect(page.locator('footer.lsd')).toBeVisible();
  return page.locator('footer.lsd').getByTestId('enamad-seal');
}

/** A number as Persian pages show it (Persian digits) or as typed (Latin): either is the same id. */
const digits = (value: string) =>
  new RegExp(`${value}|${value.replace(/[0-9]/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)])}`);

const snippet = (id: string, code: string) =>
  `<a referrerpolicy='origin' target='_blank' href='https://trustseal.enamad.ir/?id=${id}&Code=${code}'><img referrerpolicy='origin' src='https://trustseal.enamad.ir/logo.aspx?id=${id}&Code=${code}' alt='' style='cursor:pointer' code='${code}'></a>`;

test.describe.configure({ mode: 'serial' });

test.beforeAll(async () => {
  savedGateways = await sql!<GatewayRow[]>`select code, is_enabled, sort_order, settings from booking.payment_gateways`;
  await sql!`delete from content.domain_trust_seals where host = 'site-c.localhost'`;
  // Zibal starts as a fresh install would: disabled, no tokens.
  await sql!`update booking.payment_gateways set is_enabled = false, settings = settings || '{"domainMerchants": [], "sandbox": false}'::jsonb where code = 'zibal'`;
  await user(ids.admin, 'admin');
  await user(ids.customer, 'customer');
  await sql!`insert into customer.wallet_accounts (user_id, default_currency) values (${ids.customer}, 'IRR')`;
  await fetch(`${ZIBAL}/__zibal/payments`, { method: 'DELETE' });
});

test.afterAll(async () => {
  if (!sql) return;
  for (const row of savedGateways) {
    await sql`update booking.payment_gateways set is_enabled = ${row.is_enabled}, sort_order = ${row.sort_order}, settings = ${sql.json(row.settings as never)} where code = ${row.code}`;
  }
  await sql`delete from content.domain_trust_seals where host = 'site-c.localhost'`;
  await sql.end({ timeout: 5 });
});

test('each domain shows its own Enamad seal; the admin adds, replaces and removes one', async ({ page, context }) => {
  // Seeded by the runner: site-a and site-b differ, site-c has none.
  await expect(await footerSeal(page, SITE_A)).toHaveAttribute('href', /id=7764782&/);
  await expect(await footerSeal(page, SITE_B)).toHaveAttribute('href', /id=1111111&/);
  const none = await footerSeal(page, SITE_C);
  await page.waitForTimeout(4000);
  await expect(none).toHaveCount(0);

  await signIn(context, ['admin'], ids.admin);
  await goto(page, `${SITE_A}/fa/admin/enamad`);
  const form = page.getByTestId('enamad-form');
  await expect(form).toBeVisible({ timeout: 120_000 });
  await settle(page);
  await expect(page.getByTestId('enamad-row').filter({ visible: true }).filter({ hasText: 'site-a.localhost' })).toBeVisible();

  // Invalid domain and invalid code are explained, and nothing is saved.
  await form.getByLabel('دامنه', { exact: true }).fill('localhost');
  await form.getByLabel('کد نماد اینماد').fill(snippet('5555555', 'SiteCSealCode001'));
  await expect(form.getByTestId('enamad-parsed')).toContainText(digits('5555555'));
  await form.getByRole('button', { name: 'ذخیرهٔ نماد' }).click();
  await expect(form.getByText('دامنه را مثل lsevincare.com وارد کنید.')).toBeVisible();
  await form.getByLabel('دامنه', { exact: true }).fill('site-c.localhost');
  await form.getByLabel('کد نماد اینماد').fill('just some text');
  await form.getByRole('button', { name: 'ذخیرهٔ نماد' }).click();
  await expect(form.getByText(/شناسه و کد اینماد در متن پیدا نشد/)).toBeVisible();
  expect((await sql!`select 1 from content.domain_trust_seals where host = 'site-c.localhost'`).length).toBe(0);

  // Paste the real install code; Enter submits.
  await form.getByLabel('کد نماد اینماد').fill(snippet('5555555', 'SiteCSealCode001'));
  await form.getByLabel('دامنه', { exact: true }).press('Enter');
  const row = page.getByTestId('enamad-row').filter({ visible: true }).filter({ hasText: 'site-c.localhost' });
  await expect(row).toBeVisible();
  await expect(row).toContainText(digits('5555555'));

  // Survives a refresh, and only site-c shows it.
  await page.reload();
  await expect(page.getByTestId('enamad-row').filter({ visible: true }).filter({ hasText: 'site-c.localhost' })).toBeVisible();
  await expect(await footerSeal(page, SITE_C)).toHaveAttribute('href', 'https://trustseal.enamad.ir/?id=5555555&Code=SiteCSealCode001');
  await expect((await footerSeal(page, SITE_C)).locator('img')).toHaveAttribute('referrerpolicy', 'origin');
  await expect(await footerSeal(page, SITE_A)).toHaveAttribute('href', /id=7764782&/);

  // Replace it, then remove it (two clicks).
  await goto(page, `${SITE_A}/fa/admin/enamad`);
  await settle(page);
  await page.getByLabel('دامنه', { exact: true }).fill('www.site-c.localhost');
  await page.getByLabel('کد نماد اینماد').fill('6666666 SiteCSealCode002');
  await page.getByRole('button', { name: 'ذخیرهٔ نماد' }).click();
  await expect(page.getByTestId('enamad-row').filter({ visible: true }).filter({ hasText: 'site-c.localhost' })).toContainText(digits('6666666'));
  await expect(await footerSeal(page, SITE_C)).toHaveAttribute('href', /id=6666666&Code=SiteCSealCode002$/);

  await goto(page, `${SITE_A}/fa/admin/enamad`);
  await settle(page);
  const remove = page.getByRole('button', { name: 'حذف نماد site-c.localhost' }).filter({ visible: true });
  await remove.click();
  await page.getByRole('button', { name: 'برای حذف نماد site-c.localhost دوباره کلیک کنید' }).filter({ visible: true }).click();
  await expect(page.getByTestId('enamad-row').filter({ visible: true }).filter({ hasText: 'site-c.localhost' })).toHaveCount(0);
  const gone = await footerSeal(page, SITE_C);
  await page.waitForTimeout(4000);
  await expect(gone).toHaveCount(0);
});

test('a customer cannot open the Enamad admin page', async ({ page, context }) => {
  await signIn(context, ['customer'], ids.customer);
  await goto(page, `${SITE_A}/fa/admin/enamad`);
  await expect(page.getByTestId('enamad-form')).toHaveCount(0);
});

test('the admin sets a Zibal token per domain; a domain without a token is refused', async ({ page, context }) => {
  await signIn(context, ['admin'], ids.admin);
  await goto(page, `${SITE_A}/fa/admin/payment-gateways/zibal`);
  const card = page.getByTestId('zibal-domain-tokens');
  await expect(card).toBeVisible({ timeout: 120_000 });
  await settle(page);

  await card.getByRole('button', { name: 'افزودن دامنه' }).click();
  await card.getByRole('button', { name: 'افزودن دامنه' }).click();
  const rows = card.getByTestId('zibal-domain-row');
  await rows.nth(0).getByLabel('دامنه', { exact: true }).fill('site-a.localhost');
  await rows.nth(0).getByLabel('کد مرچنت (توکن) زیبال').fill(TOKEN_A);
  await rows.nth(1).getByLabel('دامنه', { exact: true }).fill('site-b.localhost');
  // No token for site-b yet: refused, nothing stored.
  await page.getByRole('switch').first().click(); // enabled
  await page.getByRole('button', { name: 'Save settings' }).click();
  await expect(page.getByText('Enter the merchant token for site-b.localhost.')).toBeVisible();
  const [before] = await sql!`select settings->'domainMerchants' as m, is_enabled from booking.payment_gateways where code = 'zibal'`;
  expect(before!.m).toEqual([]);
  expect(before!.is_enabled).toBe(false);

  await rows.nth(1).getByLabel('کد مرچنت (توکن) زیبال').fill(TOKEN_B);
  await page.getByRole('button', { name: 'Save settings' }).click();
  await expect(page.getByText('Payment gateway settings saved.')).toBeVisible();

  // After a refresh: both domains listed, tokens never shown in full, blank keeps them.
  await page.reload();
  await settle(page);
  await expect(card.getByTestId('zibal-domain-row')).toHaveCount(2);
  // What the page renders, without <script> payloads: the dev server's React debug info echoes
  // every awaited DB result into scripts (production builds strip it), so check the rendered DOM.
  const rendered = await page.evaluate(() => {
    const copy = document.documentElement.cloneNode(true) as HTMLElement;
    copy.querySelectorAll('script').forEach((node) => node.remove());
    const values = Array.from(document.querySelectorAll('input')).map((input) => input.value).join(' ');
    return copy.outerHTML + values;
  });
  expect(rendered).not.toContain(TOKEN_A);
  expect(rendered).not.toContain(TOKEN_B);
  await expect(card.getByTestId('zibal-domain-row').first().getByLabel('کد مرچنت (توکن) زیبال')).toHaveAttribute('placeholder', /••••/);
  await page.getByRole('button', { name: 'Save settings' }).click();
  await expect(page.getByText('Payment gateway settings saved.')).toBeVisible();
  const [after] = await sql!<{ m: Array<{ host: string; merchant: string }>; is_enabled: boolean }[]>`
    select settings->'domainMerchants' as m, is_enabled from booking.payment_gateways where code = 'zibal'`;
  expect(after!.is_enabled).toBe(true);
  expect(after!.m).toEqual([
    { host: 'site-a.localhost', merchant: TOKEN_A },
    { host: 'site-b.localhost', merchant: TOKEN_B },
  ]);
});

// The gateway return lands on the wallet in the language the callback carries (fa by default).
const RESULT = { succeeded: /Wallet topped up|کیف پول شارژ شد/, cancelled: /Payment cancelled|پرداخت لغو شد/ };

async function openTopUp(page: Page, origin: string) {
  await page.setViewportSize({ width: 390, height: 844 });
  await goto(page, `${origin}/en/n/app/mobile/profile/wallet`);
  await page.getByRole('button', { name: 'Top up wallet' }).filter({ visible: true }).first().click();
  // Inside the top-up dialog: once there are top-ups, the list behind it also shows "1,000,000".
  const dialog = page.locator('div.fixed.inset-0').filter({ hasText: 'Select amount' }).filter({ visible: true });
  await dialog.getByRole('button', { name: /1,000,000/ }).first().click();
  await dialog.getByRole('button', { name: /Online card/ }).click();
  return dialog;
}

test('a customer tops up on site-b: Zibal with site-b\'s token, back to site-b, balance credited', async ({ page, context }) => {
  await signIn(context, ['customer'], ids.customer);
  const dialog = await openTopUp(page, SITE_B);
  await expect(dialog.getByRole('button', { name: /Zibal/ })).toBeVisible();
  await dialog.getByRole('button', { name: /Zibal/ }).click();
  await page.getByRole('button', { name: /Top-up amount/ }).filter({ visible: true }).click();

  // The stub's "bank page" sends the customer straight back, like Zibal after a successful payment.
  // The wallet page shows the result and then removes it from the URL, so read it as it arrives.
  let returned: URL | null = null;
  await page.waitForURL((url) => {
    const back = url.hostname === 'site-b.localhost' && url.pathname.endsWith('/profile/wallet') && url.searchParams.has('walletPaymentStatus');
    if (back) returned = new URL(url.toString());
    return back;
  }, { timeout: 120_000 });
  expect(returned!.searchParams.get('walletPaymentStatus')).toBe('succeeded');
  await expect(page.getByText(RESULT.succeeded).filter({ visible: true }).first()).toBeVisible();

  const payments = (await (await fetch(`${ZIBAL}/__zibal/payments`)).json()) as Array<{ merchant: string; callbackUrl: string; verified: boolean; amount: number }>;
  expect(payments).toHaveLength(1);
  expect(payments[0]).toMatchObject({ merchant: TOKEN_B, verified: true, amount: 1_000_000 });
  expect(new URL(payments[0]!.callbackUrl).hostname).toBe('site-b.localhost');

  const [credit] = await sql!<{ amount: string; status: string }[]>`
    select wt.amount::text, wt.status from customer.wallet_transactions wt
    where wt.user_id = ${ids.customer}::uuid and wt.transaction_type = 'topup' and wt.status = 'completed'`;
  expect(Number(credit!.amount)).toBe(1_000_000);

  // Refreshing the return page does not credit twice.
  await page.reload();
  await expect(page.getByText(/1,000,000|۱٬۰۰۰٬۰۰۰|1000000/).filter({ visible: true }).first()).toBeVisible();
  const [{ n }] = await sql!`select count(*)::int as n from customer.wallet_transactions where user_id = ${ids.customer}::uuid and transaction_type = 'topup' and status = 'completed'`;
  expect(n).toBe(1);
});

test('cancelling at the bank changes nothing; a domain without a token is never offered Zibal', async ({ page, context }) => {
  await signIn(context, ['customer'], ids.customer);
  const dialogA = await openTopUp(page, SITE_A);
  await dialogA.getByRole('button', { name: /Zibal/ }).click();
  // Stop at the bank page and cancel there.
  const bank = page.waitForRequest((req) => req.url().includes('/start/'));
  await page.route(/\/start\/\d+$/, (route) => route.continue({ url: `${route.request().url()}?outcome=cancel` }));
  await page.getByRole('button', { name: /Top-up amount/ }).filter({ visible: true }).click();
  await bank;
  let returned: URL | null = null;
  await page.waitForURL((url) => {
    const back = url.hostname === 'site-a.localhost' && url.pathname.endsWith('/profile/wallet') && url.searchParams.has('walletPaymentStatus');
    if (back) returned = new URL(url.toString());
    return back;
  }, { timeout: 120_000 });
  expect(returned!.searchParams.get('walletPaymentStatus')).toBe('cancelled');
  await expect(page.getByText(RESULT.cancelled).filter({ visible: true }).first()).toBeVisible();
  const [{ n }] = await sql!`select count(*)::int as n from customer.wallet_transactions where user_id = ${ids.customer}::uuid and transaction_type = 'topup' and status = 'completed'`;
  expect(n).toBe(1);

  // site-c has no token: Zibal is not in the list there.
  const dialogC = await openTopUp(page, SITE_C);
  await expect(dialogC.getByText('Online card').first()).toBeVisible();
  await expect(dialogC.getByRole('button', { name: /Zibal/ })).toHaveCount(0);
});
