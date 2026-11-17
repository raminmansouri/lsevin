/**
 * Shared setup for the stays E2E suite (e2e/stays/*.spec.ts). Seeds real rows
 * through the production schema (src/features/stays/testing/fixtures.ts) with
 * unique slugs, signs in with a real signed NextAuth cookie, and records the
 * evidence screenshots the release policy asks for (CLAUDE.md §3.1).
 */
import { expect, type BrowserContext, type Locator, type Page, type TestInfo } from "@playwright/test";

import {
  isoInDays,
  seedStay,
  seedStayCity,
  seedStayProvider,
  seedUser,
  suffix,
  type SeedStayOptions,
  type SeededStay,
  type SeededUser,
} from "../../src/features/stays/testing/fixtures";
import { db } from "../tours/support/db";
import { E2E_BASE_URL } from "../tours/support/env";
import { signIn } from "../tours/support/session";

export { db, isoInDays };

export type StayWorld = { owner: SeededUser; providerId: string; city: { id: string; slug: string; name: string }; stays: SeededStay[] };

/** A provider, a uniquely named city and published stays in it. */
export async function seedWorld(stays: Partial<Omit<SeedStayOptions, "providerId" | "cityId">>[] = [{}]): Promise<StayWorld> {
  const sql = db();
  const owner = await seedUser(sql as never, { firstName: "Owner" });
  const provider = await seedStayProvider(sql as never, owner.id);
  const s = suffix();
  const name = `شیراز ${s}`;
  const city = await seedStayCity(sql as never, { slug: `shiraz-${s}`, name: { "fa-IR": name, "en-US": `Shiraz ${s}` } });
  const seeded: SeededStay[] = [];
  for (const o of stays) seeded.push(await seedStay(sql as never, { providerId: provider.id, cityId: city.id, ...o }));
  return { owner, providerId: provider.id, city: { ...city, name }, stays: seeded };
}

/** The first-visit intro was already seen on this device (the cookie the app itself sets). */
export async function skipIntro(context: BrowserContext) {
  const url = new URL(E2E_BASE_URL);
  await context.addCookies([{ name: "stays_intro_done", value: "1", domain: url.hostname, path: "/", sameSite: "Lax" }]);
}

export async function signedInCustomer(context: BrowserContext, opts: { firstName?: string; lastName?: string } = {}) {
  const user = await seedUser(db() as never, opts);
  await signIn(context, { ...user, roles: ["user"] });
  return user;
}

export async function signedInAdmin(context: BrowserContext) {
  const user = await seedUser(db() as never, { firstName: "Admin" });
  await signIn(context, { ...user, roles: ["admin"] });
  return user;
}

/** Streamed Suspense segments sit hidden in div#S:n until React swaps them in. */
export async function settled(page: Page) {
  await page.waitForLoadState("load");
  await expect(page.locator('div[hidden][id^="S:"]')).toHaveCount(0);
}

/** A full-page screenshot attached to the HTML report: `<feature>__<scenario>__<step>.png`. */
export async function evidence(page: Page, testInfo: TestInfo, name: string) {
  const file = testInfo.outputPath(`${name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  await testInfo.attach(name, { path: file, contentType: "image/png" });
}

/**
 * Fails the test on uncaught page errors, console errors and unexpected 5xx
 * responses of the app itself. `allow` lists documented, expected messages
 * (e.g. a map without a token in the test environment).
 */
export function watchErrors(page: Page, allow: RegExp[] = []) {
  const problems: string[] = [];
  const allowed = [/mapbox/i, /Failed to load resource: the server responded with a status of 404/i, /favicon/i, /\/_next\/webpack-hmr/, /Download the React DevTools/i, ...allow];
  page.on("pageerror", (e) => problems.push(`pageerror: ${e.message}`));
  page.on("console", (m) => {
    if (m.type() === "error" && !allowed.some((r) => r.test(m.text()))) problems.push(`console: ${m.text().slice(0, 300)}`);
  });
  page.on("response", (r) => {
    const u = r.url();
    if (r.status() >= 500 && u.startsWith(E2E_BASE_URL) && !allowed.some((a) => a.test(u))) problems.push(`HTTP ${r.status()} ${u}`);
  });
  return {
    assertClean: () => expect(problems, problems.join("\n")).toEqual([]),
  };
}

export function stayQuery(checkIn: string, checkOut: string, extra: Record<string, string> = {}) {
  return new URLSearchParams({ in: checkIn, out: checkOut, ...extra }).toString();
}

export async function bookingRow(bookingId: string) {
  const [row] = await db()<{ status: string; total_amount: string; check_in: string; check_out: string; rooms: number; payment_status: string }[]>`
    select sb.status, sb.total_amount::text, sb.check_in::text, sb.check_out::text, sb.rooms, bb.payment_status
      from stay.bookings sb join booking.bookings bb on bb.id = sb.booking_id where sb.booking_id = ${bookingId}::uuid`;
  return row;
}

export async function soldOn(roomTypeId: string, night: string) {
  const [r] = await db()<{ sold: number; held: number }[]>`select sold, held from stay.inventory where room_type_id = ${roomTypeId}::uuid and stay_date = ${night}::date`;
  return r ?? { sold: 0, held: 0 };
}

/** Digits of a displayed amount (Persian/Arabic digits and separators allowed). */
export function amountOf(text: string): number {
  const latin = text.replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d))).replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
  const first = latin.match(/\d[\d,٬.\s]*\d|\d/);
  return first ? Number(first[0].replace(/[^\d]/g, "")) : NaN;
}

/**
 * The platform shows IRR either as rial or as toman (÷10) depending on the
 * visitor's display rules; the amount must be one of the two, never anything else.
 */
export async function expectIrr(locator: Locator, rial: number) {
  await expect(locator).toBeVisible();
  await expect.poll(async () => {
    const n = amountOf(await locator.innerText());
    return n === rial || n === rial / 10;
  }, { message: `expected ${rial} IRR (or ${rial / 10} toman)` }).toBe(true);
}
