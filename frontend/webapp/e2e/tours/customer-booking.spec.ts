/**
 * Booking through the real UI on the real booking/payment engine:
 *   - browse → details → date → travelers → hold → guest data → review → wallet payment → voucher;
 *     refresh keeps it, My Bookings lists it, cancellation inside the window refunds per policy (AT-12)
 *   - AT-09 double submit / reload during confirm → exactly one booking
 *   - AT-11 price changed mid-checkout → explained, nothing charged, entered data kept
 *   - AT-07 two customers race for the last seat → one hold, the other gets the localized capacity message
 *   - request-to-book shows the pending state and its expiry (C-096)
 */
import { expect, test, type Page } from "@playwright/test";

import { bookUrl, fillAndConfirm, seedCatalog, signedInCustomer, skipIntro, tourBookings } from "./customer-helpers";
import { closeDb, db, fundWalletViaLedger } from "./support/db";
import { signIn } from "./support/session";

test.afterAll(closeDb);
test.describe.configure({ timeout: 360_000 });

async function pickFirstAvailable(page: Page) {
  const cal = page.getByTestId("departure-calendar");
  await cal.waitFor();
  for (let i = 0; i < 3; i += 1) {
    const cell = cal.locator('button[data-state="available"]').first();
    if ((await cell.count()) > 0) {
      await cell.click();
      return;
    }
    await cal.getByTestId("calendar-next").click();
  }
  throw new Error("no available day");
}

test("browse → book → pay with wallet → voucher → my bookings → cancel with refund", async ({ page, context }) => {
  const c = await seedCatalog([{ firstDepartureInDays: 10, adultPrice: 12_000_000, capacity: 10 }]);
  const tour = c.tours[0];
  const user = await signedInCustomer(context, { firstName: "Sara", lastName: "Wallet" });
  await skipIntro(context);
  fundWalletViaLedger(user.id, "IRR", 200_000_000);

  // Browse.
  await page.goto(`/en/tours/explore?destination=${c.destination.slug}`);
  await page.getByTestId("tour-card-link").first().click();
  await expect(page.getByTestId("tour-detail")).toBeVisible();
  await page.getByTestId("book-now").click();

  // Date-price calendar.
  await expect(page.getByTestId("booking-flow")).toHaveAttribute("data-step", "date");
  await pickFirstAvailable(page);
  await expect(page.getByTestId("selected-departure")).toBeVisible();
  await page.getByTestId("continue").click();

  // Travelers + live itemized quote.
  await expect(page.getByTestId("booking-flow")).toHaveAttribute("data-step", "travelers");
  await page.getByTestId("inc-adult").click();
  await expect(page.getByTestId("count-adult")).toHaveText("2");
  await expect(page.getByTestId("quote-total")).toContainText("24,000,000");
  await expect(page.getByTestId("price-line").first()).toContainText("Adult × 2");

  await fillAndConfirm(page, { travelers: [{ firstName: "Sara", lastName: "Wallet" }, { firstName: "Ali", lastName: "Rezaei" }] });
  await expect(page.getByTestId("booking-result")).toHaveAttribute("data-status", "pending_payment");
  await expect(page.getByTestId("amount-due")).toContainText("24,000,000");

  // Pay with the wallet through /api/booking-pro/payments/create-intent.
  await page.getByTestId("method-wallet").click();
  await page.getByTestId("pay").click();
  await expect(page).toHaveURL(/\/en\/tours\/bookings\/[0-9a-f-]{36}$/, { timeout: 60_000 });
  const voucher = page.getByTestId("voucher");
  await expect(voucher).toHaveAttribute("data-status", "confirmed");
  await expect(page.getByTestId("voucher-qr")).toBeVisible();
  await expect(page.getByTestId("voucher-attendees")).toContainText("Ali Rezaei");
  const code = (await page.getByTestId("voucher-code").innerText()).trim();
  expect(code).toMatch(/^TR-[A-Z0-9]{8}$/);

  // Persistence after refresh.
  await page.reload();
  await expect(page.getByTestId("voucher")).toHaveAttribute("data-status", "confirmed");
  const rows = await tourBookings(user.id);
  expect(rows).toHaveLength(1);
  expect(rows[0].status).toBe("confirmed");
  const [paid] = await db()<{ payment_status: string }[]>`select payment_status from booking.bookings where id = ${rows[0].booking_id}::uuid`;
  expect(paid.payment_status).toBe("Paid");

  // .ics download for the same booking.
  const ics = await page.request.get(`/api/tours/bookings/${rows[0].booking_id}/ics`);
  expect(ics.status()).toBe(200);
  expect(await ics.text()).toContain("BEGIN:VEVENT");

  // My Bookings lists it under Upcoming.
  await page.goto("/en/tours/bookings");
  await expect(page.getByTestId("booking-row").filter({ hasText: code })).toBeVisible();

  // Cancel inside the full-refund window (72h+ → 100%).
  await page.getByTestId("booking-row").filter({ hasText: code }).click();
  await page.getByTestId("cancel-booking").click();
  await expect(page.getByTestId("cancel-quote")).toContainText("100%");
  await expect(page.getByTestId("cancel-quote")).toContainText("24,000,000");
  await page.getByTestId("confirm-cancel").click();
  await expect(page.getByTestId("voucher")).toHaveAttribute("data-status", "cancelled");
  await expect(page.getByTestId("refund-history")).toContainText("100%");
  const [after] = await tourBookings(user.id);
  expect(after.status).toBe("cancelled");
  const [seats] = await db()<{ booked: number }[]>`select booked_count as booked from tour.departures where id = (select departure_id from tour.bookings where booking_id = ${after.booking_id}::uuid)`;
  expect(seats.booked).toBe(0);
});

test("AT-09: double submit and reload during confirmation create exactly one booking", async ({ page, context }) => {
  const c = await seedCatalog([{ firstDepartureInDays: 6 }]);
  const tour = c.tours[0];
  const user = await signedInCustomer(context);
  await skipIntro(context);
  await page.goto(bookUrl("en", tour.slug, tour.departureIds[0]));
  await fillAndConfirm(page, { confirm: false });
  await page.getByTestId("confirm-booking").dblclick();
  await page.getByTestId("booking-result").waitFor({ timeout: 60_000 });
  await page.reload();
  await expect(page.getByTestId("booking-result")).toBeVisible();
  for (let i = 0; i < 3; i += 1) await page.reload();
  const rows = await tourBookings(user.id);
  expect(rows).toHaveLength(1);
  const [holds] = await db()<{ n: number }[]>`select count(*)::int as n from tour.holds where user_id = ${user.id}::uuid and status = 'active'`;
  expect(holds.n).toBe(0);
});

test("AT-11: a price change during checkout is explained and entered data is kept", async ({ page, context }) => {
  const c = await seedCatalog([{ firstDepartureInDays: 6, adultPrice: 10_000_000 }]);
  const tour = c.tours[0];
  const user = await signedInCustomer(context);
  await skipIntro(context);
  await page.goto(bookUrl("en", tour.slug, tour.departureIds[0]));
  await fillAndConfirm(page, { confirm: false, travelers: [{ firstName: "Mina", lastName: "Karimi" }] });

  await db()`update tour.price_tiers set amount = 11000000 where option_id = ${tour.optionId}::uuid and traveler_class = 'adult'`;
  await page.getByTestId("confirm-booking").click();
  const notice = page.getByTestId("booking-notice");
  await expect(notice).toContainText("price changed");
  await expect(notice).toContainText("11,000,000");
  expect(await tourBookings(user.id)).toHaveLength(0);

  // Entered data is still there.
  await page.getByTestId("step-back").click();
  await expect(page.getByTestId("participant").first().locator("input[type=text]").first()).toHaveValue("Mina");
  await page.getByTestId("continue").click();
  await page.getByTestId("accept-terms").locator("input").check();
  await page.getByTestId("confirm-booking").click();
  await expect(page.getByTestId("booking-result")).toHaveAttribute("data-status", "pending_payment");
  const rows = await tourBookings(user.id);
  expect(rows).toHaveLength(1);
  expect(Number(rows[0].total_amount)).toBe(11_000_000);
});

test("AT-07: two customers race for the last seat — one hold, one localized capacity message", async ({ browser }) => {
  const c = await seedCatalog([{ firstDepartureInDays: 6, capacity: 1, departures: 1 }]);
  const tour = c.tours[0];
  const pages: Page[] = [];
  const users = [];
  for (let i = 0; i < 2; i += 1) {
    const ctx = await browser.newContext();
    const { seedUser } = await import("../../src/features/tours/testing/fixtures");
    const u = await seedUser(db());
    await signIn(ctx, { ...u, roles: ["user"] });
    await skipIntro(ctx);
    const p = await ctx.newPage();
    await p.goto(bookUrl(i === 0 ? "en" : "fa", tour.slug, tour.departureIds[0]));
    await p.getByTestId("quote-total").waitFor();
    pages.push(p);
    users.push(u);
  }
  await Promise.all(pages.map((p) => p.getByTestId("continue").click()));
  const outcomes = await Promise.all(
    pages.map(async (p) => {
      const winner = p.getByTestId("details-step");
      const loser = p.getByTestId("tours-error");
      await expect(winner.or(loser)).toBeVisible({ timeout: 30_000 });
      return (await winner.count()) > 0 ? "hold" : await loser.getAttribute("data-error-code");
    }),
  );
  expect(outcomes.filter((o) => o === "hold")).toHaveLength(1);
  expect(outcomes.filter((o) => o === "insufficient_capacity")).toHaveLength(1);
  const loserIndex = outcomes.indexOf("insufficient_capacity");
  // Localized message, not a raw code.
  await expect(pages[loserIndex].getByTestId("tours-error")).toContainText(loserIndex === 0 ? "Not enough seats" : "ظرفیت");
  const [dep] = await db()<{ held: number; booked: number; capacity: number }[]>`
    select held_count as held, booked_count as booked, capacity from tour.departures where id = ${tour.departureIds[0]}::uuid`;
  expect(dep.held + dep.booked).toBeLessThanOrEqual(dep.capacity);
  for (const p of pages) await p.context().close().catch(() => undefined);
});

test("request-to-book shows the pending state with its expiry", async ({ page, context }) => {
  const c = await seedCatalog([{ firstDepartureInDays: 8, confirmationMode: "request" }]);
  const tour = c.tours[0];
  await signedInCustomer(context);
  await skipIntro(context);
  await page.goto(bookUrl("en", tour.slug, tour.departureIds[0]));
  await fillAndConfirm(page);
  await expect(page.getByTestId("booking-result")).toHaveAttribute("data-status", "requested");
  // The deadline and what happens when it passes (no reply → cancelled, nothing charged).
  await expect(page.getByTestId("request-pending")).toContainText(/reply by .+ cancelled and you pay nothing/);
  await page.getByTestId("view-voucher").click();
  await expect(page.getByTestId("voucher")).toHaveAttribute("data-status", "requested");
  await expect(page.getByTestId("qr-pending")).toBeVisible();
});
