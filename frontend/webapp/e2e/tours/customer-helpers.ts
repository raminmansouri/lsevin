/**
 * Shared setup for the customer Tours specs (e2e/tours/customer-*.spec.ts).
 * Seeds real rows through the production schema (src/features/tours/testing/fixtures.ts);
 * every call creates uniquely named data, so specs can re-run on one database.
 */
import type { BrowserContext, Locator, Page } from "@playwright/test";

import {
  seedDestination,
  seedProvider,
  seedTour,
  seedUser,
  suffix,
  type SeedTourOptions,
  type SeededTour,
  type SeededUser,
} from "../../src/features/tours/testing/fixtures";

import { db } from "./support/db";
import { E2E_BASE_URL } from "./support/env";
import { signIn } from "./support/session";

export type Catalog = { owner: SeededUser; providerId: string; destination: { id: string; slug: string }; tours: SeededTour[] };

/** A provider + a uniquely named destination + tours, published unless told otherwise. */
export async function seedCatalog(tours: Partial<Omit<SeedTourOptions, "providerId" | "destinationId">>[] = [{}]): Promise<Catalog> {
  const sql = db();
  const owner = await seedUser(sql, { firstName: "Owner" });
  const provider = await seedProvider(sql, owner.id);
  const s = suffix();
  const destination = await seedDestination(sql, {
    slug: `dest-${s}`,
    name: { "en-US": `Shiraz ${s}`, "fa-IR": `شیراز ${s}`, "ar-SA": `شيراز ${s}`, "tr-TR": `Şiraz ${s}` },
  });
  const seeded: SeededTour[] = [];
  for (const t of tours) {
    seeded.push(await seedTour(sql, { providerId: provider.id, destinationId: destination.id, translateTo: ["en-US"], ...t }));
  }
  return { owner, providerId: provider.id, destination, tours: seeded };
}

/** Marks the intro as already seen on this device (cookie the app itself sets after "Explore"). */
export async function skipIntro(context: BrowserContext) {
  const url = new URL(E2E_BASE_URL);
  await context.addCookies([{ name: "tours_intro_done", value: "1", domain: url.hostname, path: "/", sameSite: "Lax" }]);
}

export async function signedInCustomer(context: BrowserContext, opts: { firstName?: string; lastName?: string } = {}) {
  const user = await seedUser(db(), opts);
  await signIn(context, { ...user, roles: ["user"] });
  return user;
}

/** Waits until client components are interactive (Next dev compiles routes lazily). */
export async function ready(page: Page) {
  await page.waitForLoadState("domcontentloaded");
  await page.locator("[data-testid=tours-shell]").first().waitFor();
}

export function bookUrl(locale: string, slug: string, departureId?: string) {
  return `/${locale}/tours/t/${slug}/book${departureId ? `?departure=${departureId}` : ""}`;
}

export async function tourBookings(userId: string) {
  return db()<{ booking_id: string; status: string; idempotency_key: string; total_amount: string; seats: number }[]>`
    select booking_id::text, status, idempotency_key, total_amount::text, seats from tour.bookings where user_id = ${userId}::uuid order by created_at`;
}

export type Traveler = { firstName: string; lastName: string };

/**
 * Drives the real booking UI from the travelers step to the result, language-independent
 * (positions and test ids, not labels): reserve → contact + travelers → accept → confirm.
 */
export async function fillAndConfirm(
  page: Page,
  opts: { buyer?: Traveler & { phone?: string }; travelers?: Traveler[]; confirm?: boolean } = {},
) {
  await page.getByTestId("price-summary").getByTestId("quote-total").waitFor();
  await page.getByTestId("continue").click();
  await fillDetailsAndConfirm(page, opts);
}

/** From the details step: contact + travelers → review → accept → (confirm). */
export async function fillDetailsAndConfirm(
  page: Page,
  opts: { buyer?: Traveler & { phone?: string }; travelers?: Traveler[]; confirm?: boolean } = {},
) {
  const buyer = { firstName: "Sara", lastName: "Tester", phone: "+989121234567", ...opts.buyer };
  const details = page.getByTestId("details-step");
  await details.waitFor();
  const buyerInputs = details.locator("section").first().locator("input");
  await buyerInputs.nth(0).fill(buyer.firstName);
  await buyerInputs.nth(1).fill(buyer.lastName);
  await buyerInputs.nth(2).fill(buyer.phone);
  const people = details.getByTestId("participant");
  const n = await people.count();
  for (let i = 0; i < n; i += 1) {
    const p = opts.travelers?.[i] ?? { firstName: i === 0 ? buyer.firstName : "Ali", lastName: i === 0 ? buyer.lastName : `Rezaei${i}` };
    const inputs = people.nth(i).locator("input[type=text]");
    await inputs.nth(0).fill(p.firstName);
    await inputs.nth(1).fill(p.lastName);
  }
  await page.getByTestId("continue").click();
  await page.getByTestId("review-step").waitFor();
  await page.getByTestId("accept-terms").locator("input").check();
  if (opts.confirm === false) return;
  await page.getByTestId("confirm-booking").click();
  await page.getByTestId("booking-result").waitFor({ timeout: 60_000 });
}

/** Clicks a day (canonical ISO) in a CalendarPicker, paging forward months as needed. */
export async function pickIso(_page: Page, scope: Locator, iso: string) {
  for (let i = 0; i < 4; i += 1) {
    const cell = scope.locator(`button[data-iso="${iso}"]`);
    if ((await cell.count()) > 0) {
      await cell.click();
      return;
    }
    await scope.getByTestId("calendar-next").first().click();
  }
  throw new Error(`date ${iso} not reachable in the calendar`);
}

