/**
 * The complete guest journey on a phone, Persian (RTL):
 * first visit → intro → home → search (destination, dates, party) → results →
 * stay page → room → sign-in gate → hold → one-screen checkout in the account's
 * name (optional companions, validated) → booking → wallet payment → confirmed voucher → refresh →
 * trips list → cancellation with refund preview → cancelled after refresh.
 * Every step checks what the guest sees AND what the database holds.
 */
import { expect, test } from "@playwright/test";

import { fundWalletViaLedger } from "../tours/support/db";

import { seedStayBooking, seedUser } from "../../src/features/stays/testing/fixtures";

import { bookingRow, db, evidence, isoInDays, seedWorld, settled, signedInCustomer, skipIntro, soldOn, stayQuery, watchErrors } from "./helpers";

test.describe("stays guest journey @critical", () => {
  test("first visit sees the intro once, then the home page; the choice survives refresh", async ({ page }, testInfo) => {
    const errors = watchErrors(page);
    await page.goto("/fa/stays");
    await expect(page).toHaveURL(/\/fa\/stays\/intro$/);
    await expect(page.getByTestId("stays-intro")).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("رزرو هتل و اقامتگاه، ساده و مطمئن");
    await expect(page.getByTestId("stays-intro-credit")).toContainText("CC BY 2.0");
    await evidence(page, testInfo, "stays__intro__01-loaded");
    await page.getByTestId("stays-intro-continue").click();
    await expect(page).toHaveURL(/\/fa\/stays$/);
    await expect(page.getByTestId("stay-search-form")).toBeVisible();
    await evidence(page, testInfo, "stays__intro__02-home");
    await page.reload();
    await expect(page).toHaveURL(/\/fa\/stays$/);
    await page.goto("/fa/stays");
    await expect(page.getByTestId("stays-intro")).toHaveCount(0);
    errors.assertClean();
  });

  test("search → stay → book → pay → voucher → refresh → cancel", async ({ page, context }, testInfo) => {
    const world = await seedWorld([{ units: 2, taxPercent: 9 }]);
    const stay = world.stays[0];
    await skipIntro(context);
    const errors = watchErrors(page);

    // Search from home with the keyboard-operable destination combobox.
    await page.goto("/fa/stays");
    await settled(page);
    const dest = page.getByTestId("stay-destination-input");
    await dest.fill(world.city.name.split(" ")[1]);
    await expect(page.getByTestId("stay-destination-options")).toBeVisible();
    await dest.press("ArrowDown");
    await dest.press("Enter");
    await expect(dest).toHaveValue(world.city.name);

    // Party: 2 adults + a child whose age is required.
    await page.getByTestId("stay-guests-button").click();
    await page.getByTestId("stay-children-plus").click();
    await expect(page.getByTestId("stay-guests-done")).toBeDisabled();
    await page.getByTestId("stay-child-age-0").selectOption("7");
    await page.getByTestId("stay-guests-done").click();
    await expect(page.getByTestId("stay-guests-value")).toContainText("۱ کودک");

    // Submitting without dates is allowed (shows "from" prices); with past dates it is not.
    await page.getByTestId("stay-search-submit").click();
    await expect(page).toHaveURL(new RegExp(`/fa/stays/explore\\?city=${world.city.slug}&ages=7$`));
    await expect(page.getByTestId("stays-no-dates-hint")).toBeVisible();
    await expect(page.getByTestId("stay-card")).toHaveCount(1);
    await expect(page.getByTestId("stay-card-from")).toBeVisible();

    // Dates through the URL (the calendar dialog is covered in customer-search.spec).
    const ci = isoInDays(21);
    const co = isoInDays(24);
    await page.goto(`/fa/stays/explore?city=${world.city.slug}&ages=7&${stayQuery(ci, co)}`);
    await settled(page);
    await expect(page.getByTestId("stays-results-count")).toContainText("۳ شب");
    const total = page.getByTestId("stay-card-total");
    await expect(total).toBeVisible();
    await evidence(page, testInfo, "stays__journey__01-results-with-total");

    // Card → stay page keeps the stay query.
    await page.getByTestId("stay-card-link").first().click();
    await expect(page).toHaveURL(new RegExp(`/fa/stays/${stay.slug}\\?in=${ci}&out=${co}&ages=7`));
    await settled(page);
    await expect(page.getByTestId("stay-title")).toHaveText(stay.name["fa-IR"]);
    await expect(page.getByTestId("stay-breadcrumbs")).toContainText(world.city.name);
    // No search form on the stay page: the stay is one line (dates · party) that opens the pickers.
    await expect(page.getByTestId("stay-detail-search")).toHaveCount(0);
    await expect(page.getByTestId("stay-bar-guests")).toContainText("۱ کودک");
    const room = page.getByTestId("stay-room").filter({ has: page.getByTestId("stay-reserve") }).first();
    await expect(room.getByTestId("stay-plan-total")).toBeVisible();
    await evidence(page, testInfo, "stays__journey__02-stay-page-priced");

    // Reserve while signed out → sign-in gate that keeps the selection.
    await room.getByTestId("stay-reserve").click();
    await expect(page).toHaveURL(/\/fa\/stays\/.+\/book\?room=/);
    await expect(page.getByTestId("stay-booking-signin")).toBeVisible();
    const bookUrl = page.url();

    // Sign in and come back to the same URL.
    const guest = await signedInCustomer(context, { firstName: "Sara", lastName: "Ahmadi" });
    fundWalletViaLedger(guest.id, "IRR", 500_000_000);
    await page.goto(bookUrl);
    await expect(page.getByTestId("stay-hold-active")).toBeVisible();
    expect((await soldOn(stay.roomTypeId, ci)).held).toBe(1);
    const summaryTotal = await page.getByTestId("stay-booking-total").innerText();

    // Signed in: the booking is in the account's name — nothing to type (regression 2026-11-17:
    // contact and guest names were required again from a signed-in customer).
    await expect(page.getByTestId("stay-booker-name")).toHaveText("Sara Ahmadi");
    await expect(page.getByTestId("stay-field-buyer.firstName")).toHaveCount(0);
    // Companions are optional; a half-filled one is a field error, focused.
    await page.getByTestId("stay-companions-toggle").click();
    await page.getByTestId("stay-companion-add").click();
    await page.getByTestId("stay-field-guests.0.firstName").fill("علی");
    await page.getByTestId("stay-confirm").click();
    await expect(page.locator("#guests\\.0\\.lastName-err")).toBeVisible();
    await expect(page.getByTestId("stay-field-guests.0.lastName")).toBeFocused();
    await page.getByTestId("stay-field-guests.0.lastName").fill("احمدی");
    await page.getByTestId("stay-note-toggle").click();
    await page.getByTestId("stay-field-specialRequests").fill("اتاق آرام لطفاً");
    await evidence(page, testInfo, "stays__journey__03-checkout-one-screen");
    // The draft survives a refresh (sessionStorage, never the URL).
    await page.reload();
    await expect(page.getByTestId("stay-field-guests.0.lastName")).toHaveValue("احمدی");
    expect(page.url()).not.toContain("احمدی");
    await expect(page.getByTestId("stay-hold-active")).toBeVisible();
    await expect(page.getByTestId("stay-policy-summary")).toContainText("کنسلی رایگان");
    await evidence(page, testInfo, "stays__journey__04-before-confirm");
    await page.getByTestId("stay-confirm").click();

    // Booking page: waiting for payment; a hotel's address and directions show at once.
    await expect(page).toHaveURL(/\/fa\/stays\/bookings\/[0-9a-f-]{36}\?new=1$/);
    const bookingId = page.url().match(/bookings\/([0-9a-f-]{36})/)![1];
    await expect(page.getByTestId("stay-booking-status")).toHaveAttribute("data-status", "pending_payment");
    await expect(page.getByTestId("stay-booking-address")).toContainText("ارم");
    await expect(page.getByTestId("stay-booking-directions-google")).toHaveAttribute("href", /google\.com\/maps\/dir/);
    await expect(page.getByTestId("stay-booking-directions-neshan")).toBeVisible();
    await expect(page.getByTestId("stay-booking-detail-total")).toHaveText(summaryTotal);
    expect(await bookingRow(bookingId)).toMatchObject({ status: "pending_payment", rooms: 1, check_in: ci, check_out: co });
    const [saved] = await db()<any[]>`select buyer, guests, special_requests from stay.bookings where booking_id = ${bookingId}::uuid`;
    expect(saved.buyer).toMatchObject({ firstName: "Sara", lastName: "Ahmadi" });
    expect(saved.buyer.phone).toMatch(/^0?9\d{9}$/);
    expect(saved.guests).toEqual([{ firstName: "علی", lastName: "احمدی" }]);
    expect(saved.special_requests).toBe("اتاق آرام لطفاً");
    expect(await soldOn(stay.roomTypeId, ci)).toMatchObject({ sold: 1, held: 0 });

    // Pay from the wallet.
    await page.getByTestId("stay-payment-panel").getByRole("radio").first().check();
    await page.getByTestId("stay-pay").click();
    await expect(page.getByTestId("stay-booking-status")).toHaveAttribute("data-status", "confirmed");
    await expect(page.getByTestId("stay-voucher")).toBeVisible();
    await expect(page.getByTestId("stay-booking-address")).toContainText("ارم");
    await evidence(page, testInfo, "stays__journey__05-confirmed-voucher");
    expect((await bookingRow(bookingId)).status).toBe("confirmed");

    // Persisted after refresh and in the trips list.
    await page.reload();
    await expect(page.getByTestId("stay-booking-status")).toHaveAttribute("data-status", "confirmed");
    await evidence(page, testInfo, "stays__journey__06-confirmed-after-refresh");
    await page.goto("/fa/stays/bookings");
    await expect(page.getByTestId("stay-booking-item").filter({ hasText: stay.name["fa-IR"] })).toBeVisible();

    // Cancel with a refund preview from the accepted policy.
    await page.goto(`/fa/stays/bookings/${bookingId}`);
    await page.getByTestId("stay-cancel-open").click();
    await expect(page.getByTestId("stay-cancel-quote")).toContainText("۱۰۰٪");
    await expect(page.getByTestId("stay-cancel-confirm")).toBeDisabled();
    await page.getByTestId("stay-cancel-reason").fill("تغییر برنامه سفر");
    await page.getByTestId("stay-cancel-confirm").click();
    await expect(page.getByTestId("stay-booking-status")).toHaveAttribute("data-status", "cancelled");
    await expect(page.getByTestId("stay-refund-note")).toBeVisible();
    await page.reload();
    await expect(page.getByTestId("stay-booking-status")).toHaveAttribute("data-status", "cancelled");
    await evidence(page, testInfo, "stays__journey__07-cancelled-after-refresh");
    expect((await bookingRow(bookingId)).status).toBe("cancelled");
    expect((await soldOn(stay.roomTypeId, ci)).sold).toBe(0);
    errors.assertClean();
  });

  test("another account's booking is not found; trips need sign-in", async ({ page, context }) => {
    const world = await seedWorld();
    const otherUser = await seedUser(db() as never);
    const { bookingId } = await seedStayBooking(db() as never, world.stays[0], otherUser.id, { checkIn: isoInDays(40), checkOut: isoInDays(41) });
    await signedInCustomer(context);
    const res = await page.goto(`/fa/stays/bookings/${bookingId}`);
    expect(res?.status()).toBe(404);
    await expect(page.getByTestId("stays-not-found")).toBeVisible();
    await expect(page.getByText("Reza")).toHaveCount(0);
    await context.clearCookies();
    // The platform middleware sends signed-out visitors of any /bookings page to sign-in, back afterwards.
    await page.goto("/fa/stays/bookings");
    await expect(page).toHaveURL(/\/fa\/sign-in\?redirectTo=%2Ffa%2Fstays%2Fbookings/);
  });
});
