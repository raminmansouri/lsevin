/**
 * AT-01 Navigation (C-001..C-007): Lsevin categories → گردشگری → Tours; the
 * intro shows on the first visit only (survives refresh and language change),
 * the way back to the parent app works, and deep links to a tour / a booking
 * land in the Tours shell.
 */
import { expect, test } from "@playwright/test";

import { bookUrl, fillAndConfirm, seedCatalog, signedInCustomer, skipIntro } from "./customer-helpers";
import { closeDb } from "./support/db";

test.afterAll(closeDb);
// First hits compile routes on the dev server (Turbopack can take minutes).
test.describe.configure({ timeout: 360_000 });

test("category flow opens Tours; intro once; back link; deep links", async ({ page, context }) => {
  const catalog = await seedCatalog([{}]);
  const tour = catalog.tours[0];

  // 1. From the existing category browser, Tourism opens the Tours sub-application.
  await page.goto("/fa/n/app/mobile/categories");
  const tourism = page.locator('a[data-opens-tours="true"]').filter({ hasText: "گردشگری" }).first();
  await expect(tourism).toBeVisible();
  await tourism.click();

  // 2. First eligible visit → intro (redirected from Tours home).
  await expect(page).toHaveURL(/\/fa\/tours\/intro/);
  const intro = page.getByTestId("tours-intro");
  await expect(intro).toBeVisible();
  await expect(page.getByTestId("tours-shell")).toHaveAttribute("dir", "rtl");
  // Accessible, non-gesture CTA.
  const cta = page.getByTestId("intro-continue");
  await expect(cta).toBeEnabled();
  await cta.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/fa\/tours\/?$/);
  await expect(page.getByTestId("tours-bottom-nav")).toBeVisible();

  // 3. Returning visit, refresh and another language: no intro.
  await page.reload();
  await expect(page).toHaveURL(/\/fa\/tours\/?$/);
  await page.goto("/en/tours");
  await expect(page).toHaveURL(/\/en\/tours\/?$/);
  await expect(page.getByTestId("tours-intro")).toHaveCount(0);

  // 4. Bottom navigation reaches Explore and back Home.
  await page.getByTestId("tours-bottom-nav").getByRole("link", { name: "Explore" }).click();
  await expect(page).toHaveURL(/\/en\/tours\/explore/);
  await expect(page.getByTestId("tours-bottom-nav").getByRole("link", { name: "Explore" })).toHaveAttribute("aria-current", "page");

  // 5. Back to the parent Lsevin app.
  await page.goto("/fa/tours");
  await page.getByTestId("back-to-lsevin").first().click();
  await expect(page).toHaveURL(/\/fa\/n\/app\/mobile\/home/);

  // 6. Deep link to a tour lands in the Tours shell with its navigation (no intro detour).
  await page.goto(`/fa/tours/t/${tour.slug}`);
  await expect(page.getByTestId("tour-detail")).toBeVisible();
  await expect(page.getByTestId("tours-bottom-nav")).toBeVisible();

  // 7. Deep link to a booking: book a free departure, then open its voucher URL directly in a new page.
  await signedInCustomer(context);
  const free = await seedCatalog([{ adultPrice: 0, childPrice: 0 }]);
  await page.goto(bookUrl("en", free.tours[0].slug, free.tours[0].departureIds[0]));
  await fillAndConfirm(page);
  await expect(page.getByTestId("booking-result")).toHaveAttribute("data-status", "confirmed");
  const voucherHref = await page.getByTestId("view-voucher").getAttribute("href");
  expect(voucherHref).toMatch(/\/tours\/bookings\/[0-9a-f-]{36}$/);
  const deep = await context.newPage();
  await deep.goto(voucherHref!.replace(/^\/en\//, "/fa/"));
  await expect(deep.getByTestId("voucher")).toBeVisible();
  await expect(deep.getByTestId("tours-bottom-nav")).toBeVisible();
  await expect(deep.getByTestId("tours-shell")).toHaveAttribute("dir", "rtl");
});

test("reopening the intro from Profile keeps saved preferences", async ({ page, context }) => {
  await signedInCustomer(context);
  await skipIntro(context);
  await page.goto("/en/tours/profile");
  await page.getByTestId("profile").locator("label", { has: page.getByTestId("calendar-option-persian") }).click();
  await expect(page.getByTestId("profile").getByTestId("calendar-option-persian")).toBeChecked();
  await page.getByTestId("reopen-intro").click();
  await expect(page.getByTestId("tours-intro")).toBeVisible();
  await page.getByTestId("intro-continue").click();
  await expect(page).toHaveURL(/\/en\/tours\/profile/);
  await expect(page.getByTestId("profile").getByTestId("calendar-option-persian")).toBeChecked();
});
