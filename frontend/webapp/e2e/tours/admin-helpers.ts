/**
 * Shared setup for the admin-*.spec.ts suites (not a spec itself).
 * Seeds through the e2e database the same rows the app writes; signs in with
 * a real signed NextAuth cookie (support/session.ts).
 */
import type { BrowserContext, Page } from "@playwright/test";
import { expect } from "@playwright/test";

import { idemKey, seedUser, type SeededTour } from "../../src/features/tours/testing/fixtures";

import { db } from "./support/db";
import { E2E_BASE_URL } from "./support/env";
import { signIn } from "./support/session";

export async function signInAdmin(context: BrowserContext) {
  const user = await seedUser(db(), { firstName: "Admin" });
  await signIn(context, { ...user, roles: ["admin"] });
  return user;
}

/** Customers skip the first-visit intro (C-002) so pages render their content directly. */
export async function skipIntro(context: BrowserContext) {
  const url = new URL(E2E_BASE_URL);
  await context.addCookies([{ name: "tours_intro_done", value: "1", domain: url.hostname, path: "/" }]);
}

/**
 * A confirmed tour booking written exactly like checkout writes it (booking.bookings
 * + tour.bookings + participants, seats counted on the departure).
 */
export async function seedBooking(t: SeededTour, providerId: string, userId: string, seats = 1, departureId = t.departureIds[0]) {
  const sql = db();
  const bookingId = crypto.randomUUID();
  const voucher = `TR-AD${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  const [d] = await sql<any[]>`select starts_on::text, provider_service_id::text from tour.departures where id = ${departureId}`;
  await sql`insert into booking.bookings (id, provider_id, service_id, selected_date, payment_method, add_ons, upload_files, additional_services, payment_status, booking_status, user_id,
               currency_code, total_amount, paid_amount, booking_ui_mode)
             values (${bookingId}, ${providerId}, ${d.provider_service_id}, ${d.starts_on}, 'free_booking', '[]', '[]', '[]', 'NotRequired', 'Confirmed', ${userId}, 'IRR', 0, 0, 'custom_form')`;
  await sql`insert into tour.bookings (booking_id, tour_id, departure_id, user_id, service_provider_id, status, confirmation_mode, seats, travelers, currency_code, total_amount,
               price_snapshot, policy_version_id, policy_snapshot, policy_locale, policy_accepted_at, content_snapshot, ui_locale, display_calendar, buyer, voucher_code, qr_token, idempotency_key)
             values (${bookingId}, ${t.id}, ${departureId}, ${userId}, ${providerId}, 'confirmed', 'instant', ${seats}, ${sql.json({ adult: seats })}, 'IRR', 0, '{}', ${t.policyVersionId}, '{}', 'fa-IR', now(),
                     '{}', 'en-US', 'gregory', ${sql.json({ firstName: "Sara", lastName: "Tester", phone: "+989121234567", email: "sara@example.test" })}, ${voucher}, ${idemKey()}, ${idemKey()})`;
  await sql`update tour.departures set booked_count = booked_count + ${seats} where id = ${departureId}`;
  for (let i = 1; i <= seats; i += 1) {
    await sql`insert into tour.booking_participants (booking_id, position, traveler_class, first_name, last_name) values (${bookingId}, ${i}, 'adult', 'Sara', ${`Tester${i}`})`;
  }
  return { bookingId, voucher };
}

/** Waits for the success toast of an admin action (sonner). */
export async function expectToast(page: Page, text?: string | RegExp) {
  // Several toasts can be stacked; match the one with the expected text (newest first otherwise).
  const toast = text ? page.locator("[data-sonner-toast]", { hasText: text }).first() : page.locator("[data-sonner-toast]").first();
  await expect(toast).toBeVisible();
  return toast;
}

/** Opens a tab of the tour editor (scoped to the editor's own navigation). */
export async function editorTab(page: Page, name: string) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const link = page.getByRole("navigation", { name: "Editor sections" }).getByRole("link", { name: new RegExp(`^${escaped}( \\(\\d+\\))?$`) });
  const href = await link.getAttribute("href");
  await link.click();
  await page.waitForURL((url) => href != null && url.href.endsWith(href.split("/").pop()!), { timeout: 180_000 });
  await expect(link).toHaveAttribute("aria-current", "page", { timeout: 60_000 });
}
