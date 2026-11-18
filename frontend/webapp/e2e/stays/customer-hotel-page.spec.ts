/**
 * The 2026-11-17 (second round) hotel page, as a guest uses it on a phone:
 *   - no search form on a hotel page; dates and party are one line that opens the pickers;
 *   - choosing a room before dates opens the date picker (each night's price under the day)
 *     and comes back to that room, ready to reserve;
 *   - rooms sort by price / capacity and filter in one tap; every room opens a sheet with its
 *     own photos, rates and the reviews of guests who stayed in it;
 *   - the map is a light picture that opens Google Maps / Neshan / Balad / Waze directions;
 *   - nothing on the stays pages scrolls sideways;
 *   - a signed-in guest books in one tap: name and mobile come from the account.
 */
import { expect, test, type Page } from "@playwright/test";

import { seedStayBooking, seedUser } from "../../src/features/stays/testing/fixtures";

import { bookingRow, db, evidence, isoInDays, seedWorld, settled, signedInCustomer, skipIntro, watchErrors, type StayWorld } from "./helpers";

/** A hotel with three room types (cheap / mid / large), room photos and a landmark nearby. */
async function hotelWorld(): Promise<StayWorld & { rooms: { suite: string; triple: string } }> {
  const world = await seedWorld([{ units: 3, basePrice: 4_500_000 }]);
  const sql = db();
  const stay = world.stays[0];
  const addRoom = async (code: string, fa: string, occ: number, price: number, meal: string) => {
    const [rt] = await sql<{ id: string }[]>`
      insert into stay.room_types (property_id, code, name, units, base_occupancy, max_adults, max_children, max_occupancy, bed_config, sort_order)
      values (${stay.id}::uuid, ${code}, ${sql.json({ "fa-IR": fa, "en-US": code })}, 2, ${occ}, ${occ}, 0, ${occ}, ${sql.json([{ type: "single", count: occ }])}, 5)
      returning id::text`;
    await sql`insert into stay.rate_plans (property_id, room_type_id, code, name, meal_plan, refundable, base_price, min_nights, max_nights)
              values (${stay.id}::uuid, ${rt.id}::uuid, 'std', '{}'::jsonb, ${meal}, true, ${price}, 1, 30)`;
    return rt.id;
  };
  const suite = await addRoom("suite", "سوئیت لوکس", 2, 9_000_000, "room_only");
  const triple = await addRoom("triple", "اتاق سه تخته اقتصادی", 3, 3_000_000, "room_only");
  // The suite has its own photos; the triple has none (it must not borrow the hotel's facade).
  for (const [i, url] of ["/images/stays/mashhad-imam-reza-shrine-night-sm.webp", "/images/stays/tabriz-el-goli-night-sm.webp"].entries()) {
    await sql`insert into stay.media (property_id, room_type_id, url, alt, sort_order, is_cover) values (${stay.id}::uuid, ${suite}::uuid, ${url}, ${sql.json({ "fa-IR": "سوئیت" })}, ${i + 1}, false)`;
  }
  await sql`insert into stay.landmarks (city_id, slug, kind, name, latitude, longitude, is_quick)
            values (${world.city.id}::uuid, 'eram', 'attraction', ${sql.json({ "fa-IR": "باغ ارم", "en-US": "Eram Garden" })}, 29.6363, 52.5228, true)`;
  return { ...world, rooms: { suite, triple } };
}

async function roomNames(page: Page) {
  return page.getByTestId("stay-room-name").allInnerTexts();
}

async function noSidewaysScroll(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
}

test.describe("stays hotel page @critical", () => {
  test("no search form; rooms sort and filter instantly; nothing scrolls sideways", async ({ page, context }, testInfo) => {
    const world = await hotelWorld();
    await skipIntro(context);
    const errors = watchErrors(page);
    await page.goto(`/fa/stays/${world.stays[0].slug}`);
    await settled(page);
    await expect(page.getByTestId("stay-detail-search")).toHaveCount(0);
    await expect(page.getByTestId("stay-bar")).toBeVisible();
    await expect(page.getByTestId("stay-section-tabs")).toBeVisible();
    await expect(page.getByTestId("stay-room")).toHaveCount(3);
    await evidence(page, testInfo, "stays__hotel__01-page");
    await noSidewaysScroll(page);

    await page.getByTestId("stay-rooms-sort").selectOption("price_asc");
    expect(await roomNames(page)).toEqual(["اتاق سه تخته اقتصادی", "اتاق دو تخته", "سوئیت لوکس"]);
    await page.getByTestId("stay-rooms-sort").selectOption("price_desc");
    expect(await roomNames(page)).toEqual(["سوئیت لوکس", "اتاق دو تخته", "اتاق سه تخته اقتصادی"]);
    await page.getByTestId("stay-rooms-sort").selectOption("capacity");
    // The seeded double room takes up to 4 (2 adults + 2 children), the triple 3, the suite 2.
    expect(await roomNames(page)).toEqual(["اتاق دو تخته", "اتاق سه تخته اقتصادی", "سوئیت لوکس"]);

    // Breakfast: only the seeded double room's rate includes it.
    await page.getByTestId("stay-rooms-filter-breakfast").click();
    await expect(page.getByTestId("stay-rooms-filter-breakfast")).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByTestId("stay-room")).toHaveCount(1);
    await page.getByTestId("stay-rooms-filter-breakfast").click();
    await expect(page.getByTestId("stay-room")).toHaveCount(3);

    // The room without photos shows a neutral room tile, never the hotel's cover photo.
    const triple = page.locator(`[data-room-id="${world.rooms.triple}"]`);
    await expect(triple.locator("img")).toHaveCount(0);

    // City page chips wrap instead of scrolling sideways.
    await page.goto(`/fa/stays/city/${world.city.slug}`);
    await settled(page);
    const chips = page.getByTestId("stays-quick-filters");
    expect(await chips.evaluate((el) => el.scrollWidth - el.clientWidth)).toBeLessThanOrEqual(1);
    expect(await page.getByTestId("stays-near-chips").evaluate((el) => el.scrollWidth - el.clientWidth)).toBeLessThanOrEqual(1);
    await noSidewaysScroll(page);
    errors.assertClean();
  });

  test("choosing a room before dates: date picker with nightly prices → back on that room, ready to reserve (regression)", async ({ page, context }, testInfo) => {
    const world = await hotelWorld();
    await skipIntro(context);
    await page.goto(`/fa/stays/${world.stays[0].slug}`);
    await settled(page);
    const suite = page.locator(`[data-room-id="${world.rooms.suite}"]`);
    await suite.getByTestId("stay-room-select").click();
    const dialog = page.getByTestId("stay-dates-dialog");
    await expect(dialog).toBeVisible();
    // Each night's lowest price (thousand toman) is under the day: 3,000,000 rial → ۳۰۰.
    await expect(page.getByTestId("stay-dates-note")).toContainText("هزار تومان");
    const pick = async (iso: string) => {
      const day = dialog.locator(`[data-testid="stay-range-calendar"] button[data-iso="${iso}"]`);
      if ((await day.count()) === 0) await dialog.getByRole("button", { name: "ماه بعد" }).click();
      await day.click();
    };
    await pick(isoInDays(3));
    await expect(dialog.locator(`button[data-iso="${isoInDays(3)}"]`)).toContainText("۳۰۰");
    await pick(isoInDays(5));
    await evidence(page, testInfo, "stays__hotel__02-calendar-prices");
    await page.getByTestId("stay-dates-done").click();

    await expect(page).toHaveURL(new RegExp(`in=${isoInDays(3)}&out=${isoInDays(5)}.*room=${world.rooms.suite}`));
    const sheet = page.getByTestId("stay-room-sheet");
    await expect(sheet).toBeVisible();
    await expect(sheet.getByRole("heading", { name: "سوئیت لوکس" })).toBeVisible();
    await expect(sheet.getByTestId("stay-room-photo-count")).toContainText("۲");
    await expect(sheet.getByTestId("stay-plan-total").first()).toBeVisible();
    await evidence(page, testInfo, "stays__hotel__03-room-sheet");
    await sheet.getByTestId("stay-reserve").first().click();
    await expect(page).toHaveURL(new RegExp(`/book\\?room=${world.rooms.suite}`));
  });

  test("a room's sheet shows the reviews of guests who stayed in that room", async ({ page, context }) => {
    const world = await hotelWorld();
    const stay = world.stays[0];
    const sql = db();
    const u = await seedUser(sql as never);
    const { bookingId } = await seedStayBooking(sql as never, stay, u.id, { checkIn: isoInDays(-6), checkOut: isoInDays(-4), status: "completed" });
    await sql`insert into stay.reviews (booking_id, property_id, user_id, rating, body, author_name, status) values (${bookingId}::uuid, ${stay.id}::uuid, ${u.id}::uuid, 5, 'اتاق دو تخته تمیز و ساکت بود', 'مریم', 'published')`;
    await sql`update stay.properties set rating_avg = 5, review_count = 1 where id = ${stay.id}::uuid`;
    await skipIntro(context);
    await page.goto(`/fa/stays/${stay.slug}`);
    await settled(page);
    await page.locator(`[data-room-id="${stay.roomTypeId}"]`).getByTestId("stay-room-open").click();
    await expect(page.getByTestId("stay-room-reviews")).toContainText("تمیز و ساکت");
    await page.keyboard.press("Escape");
    await page.locator(`[data-room-id="${world.rooms.suite}"]`).getByTestId("stay-room-open").click();
    await expect(page.getByTestId("stay-room-reviews")).not.toContainText("تمیز و ساکت");
    await expect(page.getByTestId("stay-room-reviews")).toContainText("هنوز برای این اتاق نظری ثبت نشده است");
  });

  test("the map opens directions in Google Maps, Neshan, Balad or Waze", async ({ page, context }, testInfo) => {
    const world = await hotelWorld();
    await skipIntro(context);
    await page.goto(`/fa/stays/${world.stays[0].slug}`);
    await settled(page);
    await page.getByTestId("stay-map-preview").click();
    const sheet = page.getByTestId("stay-directions-sheet");
    await expect(sheet).toBeVisible();
    await expect(sheet.getByTestId("stay-directions-google")).toHaveAttribute("href", "https://www.google.com/maps/dir/?api=1&destination=29.636300,52.525800");
    await expect(sheet.getByTestId("stay-directions-google")).toHaveAttribute("target", "_blank");
    await expect(sheet.getByTestId("stay-directions-neshan")).toHaveAttribute("href", /neshan\.org\/maps\/@29\.636300,52\.525800/);
    await expect(sheet.getByTestId("stay-directions-balad")).toHaveAttribute("href", /balad\.ir\/location\?latitude=29\.636300&longitude=52\.525800/);
    await evidence(page, testInfo, "stays__hotel__04-directions");
    // The heavy interactive map is only loaded when asked for.
    expect(await page.evaluate(() => performance.getEntriesByType("resource").some((r) => /api\.mapbox\.com\/(fonts|map-sessions|v4)\//.test(r.name)))).toBe(false);
  });

  test("signed in: one tap books in the account's name; companions optional (regression)", async ({ page, context }, testInfo) => {
    const world = await hotelWorld();
    const stay = world.stays[0];
    await skipIntro(context);
    const user = await signedInCustomer(context, { firstName: "Reza", lastName: "Karimi" });
    await page.goto(`/fa/stays/${stay.slug}?in=${isoInDays(40)}&out=${isoInDays(42)}`);
    await settled(page);
    // With dates the stay bar is at its longest: still nothing may scroll sideways (regression).
    await noSidewaysScroll(page);
    await page.locator(`[data-room-id="${stay.roomTypeId}"]`).getByTestId("stay-reserve").click();
    await expect(page.getByTestId("stay-hold-active")).toBeVisible();
    await noSidewaysScroll(page);
    await expect(page.getByTestId("stay-booker-name")).toHaveText("Reza Karimi");
    // Nothing required on screen: no name / phone / guest inputs.
    await expect(page.locator("[data-testid^='stay-field-']")).toHaveCount(0);
    await evidence(page, testInfo, "stays__hotel__05-checkout");
    await page.getByTestId("stay-confirm").click();
    await expect(page).toHaveURL(/\/stays\/bookings\/[0-9a-f-]{36}\?new=1$/);
    const bookingId = page.url().match(/bookings\/([0-9a-f-]{36})/)![1];
    expect((await bookingRow(bookingId)).status).toBe("pending_payment");
    const [b] = await db()<any[]>`select buyer, guests from stay.bookings where booking_id = ${bookingId}::uuid`;
    const [acc] = await db()<any[]>`select phone_number from identity.asp_net_users where id = ${user.id}::uuid`;
    expect(b.buyer).toMatchObject({ firstName: "Reza", lastName: "Karimi", phone: `0${acc.phone_number}` });
    expect(b.guests).toEqual([]);
  });
});
