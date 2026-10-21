import { expect, test, type BrowserContext, type Page } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import postgres from 'postgres';
import { encode } from 'next-auth/jwt';

/**
 * Mobile itinerary (booking step 3 on phones), end to end: real Next server, real API
 * routes, real Postgres.
 *
 * Local run (fixtures + a minted session; both refuse anything but localhost):
 *   E2E_BASE_URL=http://localhost:3100 \
 *   E2E_DATABASE_URL=postgres://…@localhost:5432/<db with migration 0078> \
 *   E2E_AUTH_SECRET=<the server's AUTH_SECRET> \
 *   npx playwright test --config playwright.booking-itinerary.config.ts
 *
 * The fixture is a clinic main service with four admin-linked add-on types (stay, transfer,
 * wellness, tour) in one city, and a draft parked on step 3. Everything is deleted afterwards.
 */

const BASE = process.env.E2E_BASE_URL || 'http://localhost:3100';
const DB_URL = process.env.E2E_DATABASE_URL || '';
const SECRET = process.env.E2E_AUTH_SECRET || '';
const isLocal = (value: string) => {
  try { return ['localhost', '127.0.0.1', '::1'].includes(new URL(value).hostname); } catch { return false; }
};
const RUNNABLE = Boolean(DB_URL && SECRET && isLocal(DB_URL) && isLocal(BASE));
test.skip(!RUNNABLE, 'Set E2E_DATABASE_URL and E2E_AUTH_SECRET (localhost only) to seed fixtures and mint a session.');

const ids = {
  category: randomUUID(), user: randomUUID(), draft: randomUUID(),
  typeClinic: randomUUID(), typeStay: randomUUID(), typeTransfer: randomUUID(), typeWellness: randomUUID(), typeTour: randomUUID(),
  defClinic: randomUUID(), defStay: randomUUID(), defTransfer: randomUUID(), defWellness: randomUUID(), defTour: randomUUID(),
  pClinic: randomUUID(), pHotel: randomUUID(), pTransfer: randomUUID(), pPool: randomUUID(), pTour: randomUUID(),
  sClinic: randomUUID(), sRoom: randomUUID(), sAirportIn: randomUUID(), sAirportOut: randomUUID(), sPool: randomUUID(), sTour: randomUUID(),
};
const MAIN_DAY = '2026-11-04';
const sql = RUNNABLE ? postgres(DB_URL, { max: 2, prepare: false }) : null;

async function seed() {
  const s = sql!;
  await s`insert into category.categories (id, name_translations, description_translations, is_active) values (${ids.category}, '{"en":"E2E"}', '{}', true)`;
  const types: Array<[string, Record<string, string>, string | null]> = [
    [ids.typeClinic, { fa: 'کلینیک', en: 'Clinic' }, null],
    [ids.typeStay, { fa: 'اقامتگاه ها', en: 'Stays' }, 'e2e/stay.png'],
    [ids.typeTransfer, { fa: 'ترانسفر', en: 'Transfer' }, null],
    [ids.typeWellness, { fa: 'تندرستی', en: 'Wellness' }, 'e2e/wellness.png'],
    [ids.typeTour, { fa: 'گردشگری', en: 'Tours' }, 'e2e/tour.png'],
  ];
  for (const [id, name, image] of types) {
    await s`insert into category.provider_types (id, name_translations, description_translations, is_active, image_url) values (${id}, ${s.json(name)}, '{}', true, ${image})`;
  }
  const defs: Array<[string, string, number]> = [
    [ids.defClinic, 'default_slot', 240], [ids.defStay, 'date_range', 0], [ids.defTransfer, 'default_slot', 90],
    [ids.defWellness, 'default_slot', 120], [ids.defTour, 'default_slot', 240],
  ];
  for (const [id, mode, minutes] of defs) {
    // requires_specialist defaults to true; these fixture services are booked without staff.
    await s`insert into category.service_definitions (id, name_translations, description_translations, category_id, duration_minutes, pricing_model, is_active, currency, value, booking_ui_mode, requires_specialist)
            values (${id}, '{"en":"Def"}', '{}', ${ids.category}, ${minutes}, 'fixed', true, 'IRT', 1, ${mode}, false)`;
  }
  const links: Array<[string, string, number]> = [[ids.typeStay, 'Hotel', 1], [ids.typeTransfer, 'Car', 2], [ids.typeWellness, 'Waves', 3], [ids.typeTour, 'Map', 4]];
  for (const [typeId, icon, order] of links) {
    await s`insert into category.service_definition_addon_provider_types (service_definition_id, provider_type_id, icon, is_required, display_order) values (${ids.defClinic}, ${typeId}, ${icon}, false, ${order})`;
  }
  const providers: Array<[string, string, string]> = [
    [ids.pClinic, ids.typeClinic, 'کلینیک آزمون'], [ids.pHotel, ids.typeStay, 'هتل باغ نارنج'], [ids.pTransfer, ids.typeTransfer, 'ترانسفر آسان‌سفر'],
    [ids.pPool, ids.typeWellness, 'مجموعه آبی آرام'], [ids.pTour, ids.typeTour, 'گشت تهران'],
  ];
  for (const [id, typeId, name] of providers) {
    await s`insert into category.service_providers (id, provider_type_id, name_translations, description_translations, is_active, city, country, email, phone_number_country_code, phone_number)
            values (${id}, ${typeId}, ${s.json({ fa: name, en: name })}, '{}', true, 'تهران', 'ایران', 'e2e@example.com', '+98', '9120000000')`;
  }
  const services: Array<[string, string, string, string, number]> = [
    [ids.sClinic, ids.pClinic, ids.defClinic, 'جراحی بینی', 185000000],
    [ids.sRoom, ids.pHotel, ids.defStay, 'اتاق دو تخته', 4200000],
    [ids.sAirportIn, ids.pTransfer, ids.defTransfer, 'فرودگاه امام به هتل', 1800000],
    [ids.sAirportOut, ids.pTransfer, ids.defTransfer, 'هتل به فرودگاه امام', 1700000],
    [ids.sPool, ids.pPool, ids.defWellness, 'استخر سرپوشیده', 950000],
    [ids.sTour, ids.pTour, ids.defTour, 'تور نیم‌روزه کاخ گلستان', 2500000],
  ];
  for (const [id, providerId, defId, name, value] of services) {
    await s`insert into category.provider_services (id, service_provider_id, service_definition_id, display_name_translations, description_translations, is_active, currency, value, create_date)
            values (${id}, ${providerId}, ${defId}, ${s.json({ fa: name, en: name })}, '{}', true, 'IRT', ${value}, now())`;
  }
  await s`insert into booking.booking_drafts (id, user_id, provider_id, service_id, selected_date, selected_time, selected_time_from, selected_time_to, use_lsevin, current_step, status, currency)
          values (${ids.draft}, ${ids.user}, ${ids.pClinic}, ${ids.sClinic}, ${MAIN_DAY}, '08:00', '08:00', '12:00', true, 3, 'Draft', 'IRT')`;
}

async function cleanup() {
  const s = sql;
  if (!s) return;
  await s`delete from booking.booking_draft_child_bookings where parent_draft_id = ${ids.draft}`;
  await s`delete from booking.booking_drafts where user_id = ${ids.user}`;
  await s`delete from category.provider_services where id in ${s([ids.sClinic, ids.sRoom, ids.sAirportIn, ids.sAirportOut, ids.sPool, ids.sTour])}`;
  await s`delete from category.service_providers where id in ${s([ids.pClinic, ids.pHotel, ids.pTransfer, ids.pPool, ids.pTour])}`;
  await s`delete from category.service_definition_addon_provider_types where service_definition_id = ${ids.defClinic}`;
  await s`delete from category.service_definitions where id in ${s([ids.defClinic, ids.defStay, ids.defTransfer, ids.defWellness, ids.defTour])}`;
  await s`delete from category.provider_types where id in ${s([ids.typeClinic, ids.typeStay, ids.typeTransfer, ids.typeWellness, ids.typeTour])}`;
  await s`delete from category.categories where id = ${ids.category}`;
}

async function signIn(context: BrowserContext) {
  const now = Date.now();
  const value = await encode({
    secret: SECRET,
    salt: 'authjs.session-token',
    token: {
      sub: ids.user,
      user: { id: ids.user, name: 'E2E Itinerary', accessToken: 'e2e', accessTokenExpires: now + 3_600_000, refreshTokenExpires: now + 7_200_000 },
    } as any,
  });
  const url = new URL(BASE);
  await context.addCookies([{ name: 'authjs.session-token', value, domain: url.hostname, path: '/', httpOnly: true, sameSite: 'Lax' }]);
}

const children = async () => (await sql!`select provider_type_id::text, service_id::text, selected_date::text, selected_time_from::text from booking.booking_draft_child_bookings where parent_draft_id = ${ids.draft} order by create_date`);
// A resumed draft carries only its id (provider/service params would start a new selection on step 1).
const bookingUrl = `/fa/n/app/mobile/booking?draftId=${ids.draft}`;
const itinerary = (page: Page) => page.getByTestId('mobile-itinerary');
const sheet = (page: Page) => page.getByTestId('addon-booking-sheet');
const items = (page: Page) => itinerary(page).getByTestId('itinerary-item');

async function openItinerary(page: Page) {
  // The wizard re-syncs its URL on load (a same-URL client navigation), which aborts a goto that
  // waits for 'load'; wait for the commit and then for the itinerary itself.
  // A dev server can drop the very first navigation while it compiles; retry it.
  for (let attempt = 1; ; attempt += 1) {
    try { await page.goto(bookingUrl, { waitUntil: 'commit' }); break; } catch (error) { if (attempt >= 3) throw error; }
  }
  await expect(itinerary(page)).toBeVisible();
}

async function addSlotService(page: Page, dayNumber: string, typeLabel: string, serviceName: string, time: string) {
  await itinerary(page).getByRole('button', { name: `افزودن خدمت به روز ${dayNumber}` }).click();
  await page.getByTestId('itinerary-type-sheet').getByRole('button', { name: new RegExp(typeLabel) }).click();
  await expect(sheet(page)).toBeVisible();
  // One provider of this type: the sheet skips to its services -- and with a single service,
  // straight on to the time step, so only pick a service when the list is shown.
  const slots = sheet(page).getByRole('group', { name: 'ساعت شروع' });
  const service = sheet(page).getByRole('button', { name: new RegExp(serviceName) });
  await expect(service.or(slots)).toBeVisible();
  if (await service.isVisible()) await service.click();
  await slots.locator(`[data-time="${time}"]`).click();
}

// One connection for the whole file; closed only after every describe block has cleaned up.
test.afterAll(async () => { await sql?.end({ timeout: 5 }); });

test.describe('mobile itinerary', () => {
  test.use({ viewport: { width: 390, height: 844 }, locale: 'fa-IR', hasTouch: true, isMobile: true });

  test.beforeAll(async () => { await cleanup(); await seed(); });
  test.afterAll(async () => { await cleanup(); });
  test.beforeEach(async ({ context }) => { await signIn(context); });

  test('direct navigation shows the trip card, the main service and photo tiles', async ({ page }) => {
    await openItinerary(page);
    await expect(itinerary(page).getByRole('heading', { name: 'تهران، ایران' })).toBeVisible();
    await expect(itinerary(page).getByTestId('itinerary-main')).toContainText('جراحی بینی');
    await expect(itinerary(page).getByTestId('itinerary-main')).toContainText('خدمت اصلی');
    await expect(itinerary(page).getByTestId('itinerary-conflicts')).toHaveText('ندارد');

    await itinerary(page).getByRole('button', { name: 'افزودن خدمت به روز ۱' }).click();
    const tiles = page.getByTestId('itinerary-type-sheet');
    await expect(tiles.getByRole('button')).toHaveCount(4);
    // Types with an admin image get it as the tile background; types without one get the icon tile.
    await expect(tiles.getByRole('button', { name: /اقامتگاه ها/ }).locator('img')).toHaveAttribute('src', /stay\.png/);
    await expect(tiles.getByRole('button', { name: /ترانسفر/ }).locator('img')).toHaveCount(0);
    await page.keyboard.press('Escape');
    await expect(tiles).toBeHidden();
  });

  test('books two transfers (repeat type), warns on overlap, survives refresh, edits and removes', async ({ page }) => {
    await openItinerary(page);
    await itinerary(page).getByRole('button', { name: 'افزودن روز قبل' }).click();
    await expect(itinerary(page).getByTestId('itinerary-day')).toHaveCount(2);

    await addSlotService(page, '۱', 'ترانسفر', 'فرودگاه امام به هتل', '15:00');
    await sheet(page).getByRole('button', { name: 'افزودن به برنامه' }).click();
    await expect(sheet(page)).toBeHidden();
    await expect(page.getByText('به روز ۱ اضافه شد')).toBeVisible();
    await expect(items(page)).toHaveCount(1);

    // Second transfer, on the treatment day at 08:00 -- overlapping the 08:00-12:00 main service.
    await addSlotService(page, '۲', 'ترانسفر', 'هتل به فرودگاه امام', '08:00');
    await expect(sheet(page).getByRole('alert')).toContainText('جراحی بینی');
    await sheet(page).getByRole('button', { name: 'افزودن به برنامه' }).click();
    await expect(items(page)).toHaveCount(2);
    await expect(itinerary(page).getByTestId('itinerary-conflicts')).toHaveText('۲ مورد');
    expect((await children()).filter((row) => row.provider_type_id === ids.typeTransfer)).toHaveLength(2);

    await page.reload({ waitUntil: 'commit' });
    await expect(items(page)).toHaveCount(2);
    await expect(itinerary(page).getByTestId('itinerary-conflicts')).toHaveText('۲ مورد');

    // Move the clashing transfer to 13:00: the overlap disappears and stays gone after refresh.
    await items(page).filter({ hasText: 'هتل به فرودگاه امام' }).click();
    await page.getByTestId('itinerary-detail-sheet').getByRole('button', { name: 'تغییر زمان یا گزینه' }).click();
    await sheet(page).getByRole('group', { name: 'ساعت شروع' }).locator('[data-time="13:00"]').click();
    await sheet(page).getByRole('button', { name: 'ذخیره تغییرات' }).click();
    await expect(itinerary(page).getByTestId('itinerary-conflicts')).toHaveText('ندارد');
    await page.reload({ waitUntil: 'commit' });
    await expect(itinerary(page).getByTestId('itinerary-conflicts')).toHaveText('ندارد');
    expect((await children()).find((row) => row.service_id === ids.sAirportOut)?.selected_time_from).toBe('13:00:00');

    // Remove needs a second tap; the other transfer stays.
    await items(page).filter({ hasText: 'فرودگاه امام به هتل' }).click();
    const detail = page.getByTestId('itinerary-detail-sheet');
    await detail.getByRole('button', { name: 'حذف از برنامه' }).click();
    await detail.getByRole('button', { name: 'برای حذف، دوباره بزنید' }).click();
    await expect(page.getByText('از برنامه حذف شد')).toBeVisible();
    await expect(items(page)).toHaveCount(1);
    await page.reload({ waitUntil: 'commit' });
    await expect(items(page)).toHaveCount(1);
    expect(await children()).toHaveLength(1);
  });

  test('adds a hotel stay from the photo tile and shows its nights', async ({ page }) => {
    await openItinerary(page);
    await itinerary(page).getByRole('button', { name: /افزودن خدمت به روز/ }).first().click();
    await page.getByTestId('itinerary-type-sheet').getByRole('button', { name: /اقامتگاه ها/ }).click();
    // One hotel with one room type: the sheet goes straight to the stay dates.
    await expect(sheet(page).getByText('۱ شب', { exact: false }).first()).toBeVisible();
    await sheet(page).getByRole('button', { name: 'افزودن به برنامه' }).click();
    await expect(page.getByText('اقامت به سفر اضافه شد')).toBeVisible();
    await expect(itinerary(page).getByTestId('itinerary-stay')).toContainText('هتل باغ نارنج');
    await page.reload({ waitUntil: 'commit' });
    await expect(itinerary(page).getByTestId('itinerary-stay')).toContainText('۱ شب');
  });

  test('a server failure keeps the sheet open with an explanation and saves nothing', async ({ page }) => {
    await openItinerary(page);
    const before = (await children()).length;
    await page.route('**/api/booking-pro/child-booking', (route) => (route.request().method() === 'POST'
      ? route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ error: 'UNEXPECTED_ERROR' }) })
      : route.continue()));
    await addSlotService(page, '۱', 'گردشگری', 'تور نیم‌روزه کاخ گلستان', '14:00');
    await sheet(page).getByRole('button', { name: 'افزودن به برنامه' }).click();
    await expect(page.getByText('ذخیره انجام نشد. دوباره تلاش کنید.')).toBeVisible();
    await expect(sheet(page)).toBeVisible();
    expect(await children()).toHaveLength(before);
  });
});

test.describe('desktop and access', () => {
  test.beforeAll(async () => { await cleanup(); await seed(); });
  test.afterAll(async () => { await cleanup(); });

  test('desktop keeps the existing add-on cards', async ({ page, context }) => {
    await signIn(context);
    await page.setViewportSize({ width: 1366, height: 900 });
    await page.goto(bookingUrl, { waitUntil: 'commit' });
    await expect(page.getByText('ترانسفر').first()).toBeVisible();
    await expect(itinerary(page)).toBeHidden();
  });

  test('a signed-out visitor cannot reach the booking flow', async ({ page }) => {
    await page.goto(bookingUrl);
    await expect(page).not.toHaveURL(/\/n\/app\/mobile\/booking/);
  });
});
