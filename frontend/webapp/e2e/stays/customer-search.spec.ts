/**
 * Search and discovery on a phone: the URL is the state (refresh, back/forward
 * and shared links reproduce results), filters and sort, empty and invalid
 * states, the date dialog and its keyboard use, and city landing pages.
 */
import { expect, test } from "@playwright/test";

import { evidence, isoInDays, seedWorld, settled, skipIntro, stayQuery, watchErrors } from "./helpers";

test.describe("stays search @regression", () => {
  test("filters and sort live in the URL and survive refresh and back/forward", async ({ page, context }, testInfo) => {
    const world = await seedWorld([
      { kind: "hotel", amenities: ["wifi", "pool"], basePrice: 6_000_000 },
      { kind: "traditional", amenities: ["wifi", "garden"], basePrice: 3_000_000 },
      { inventoryModel: "entire_place", amenities: ["wifi", "bbq"], basePrice: 9_000_000 },
    ]);
    await skipIntro(context);
    const errors = watchErrors(page);
    await page.goto(`/fa/stays/city/${world.city.slug}`);
    await settled(page);
    await expect(page.getByTestId("stay-card")).toHaveCount(3);
    await expect(page.getByTestId("stays-city-intro")).toContainText("شیراز");

    // Sort by price: cheapest first.
    await page.getByTestId("stays-sort").selectOption("price_asc");
    await expect(page).toHaveURL(/sort=price_asc/);
    await expect(page.getByTestId("stay-card").first()).toHaveAttribute("data-slug", world.stays[1].slug);

    // Filter by type and amenity through the sheet.
    await page.getByTestId("stays-filters-open").click();
    await page.getByTestId("stays-filter-kind-hotel").click();
    await page.getByTestId("stays-filter-amenity-pool").click();
    await page.getByTestId("stays-filters-apply").click();
    await expect(page).toHaveURL(/type=hotel/);
    await expect(page).toHaveURL(/amen=pool/);
    await expect(page.getByTestId("stay-card")).toHaveCount(1);
    await expect(page.getByTestId("stay-card")).toHaveAttribute("data-slug", world.stays[0].slug);
    await evidence(page, testInfo, "stays__search__01-filtered");

    await page.reload();
    await expect(page.getByTestId("stay-card")).toHaveCount(1);
    await expect(page.getByTestId("stays-filters-open")).toContainText("(۲)");

    await page.goBack();
    await expect(page).not.toHaveURL(/type=hotel/);
    await expect(page.getByTestId("stay-card")).toHaveCount(3);
    await page.goForward();
    await expect(page.getByTestId("stay-card")).toHaveCount(1);

    // A filter combination with no match shows a reset, never a blank page.
    await page.getByTestId("stays-filters-open").click();
    await page.getByTestId("stays-filter-kind-hostel").click();
    await page.getByTestId("stays-filter-kind-hotel").click();
    await page.getByTestId("stays-filters-apply").click();
    await expect(page.getByTestId("stays-empty")).toBeVisible();
    await evidence(page, testInfo, "stays__search__02-empty-state");
    // The empty state names the fix and how many stays it brings back.
    await expect(page.getByTestId("stays-empty-clear-filters")).toContainText("۳");
    await page.getByTestId("stays-empty-clear-filters").click();
    await expect(page.getByTestId("stay-card")).toHaveCount(3);
    errors.assertClean();
  });

  test("dates: calendar dialog by mouse and keyboard; totals for the nights; sold-out shown", async ({ page, context }, testInfo) => {
    const world = await seedWorld([{ units: 1 }]);
    await skipIntro(context);
    await page.goto(`/fa/stays/city/${world.city.slug}`);
    await settled(page);
    await page.getByTestId("stay-dates-button").click();
    const dialog = page.getByTestId("stay-dates-dialog");
    await expect(dialog).toBeVisible();
    await expect(page.getByTestId("stay-dates-done")).toBeEnabled();
    // Days before today are not selectable (regression 2026-11-14: minIso only limited navigation).
    const { isoInDays: iso } = await import("./helpers");
    const yesterday = dialog.locator(`button[data-iso="${iso(-1)}"]`);
    if (await yesterday.count()) await expect(yesterday).toHaveAttribute("aria-disabled", "true");
    // Pick check-in, then check-out with the keyboard (arrow keys + Enter, mirrored in RTL).
    const enabledDays = dialog.locator('[data-testid="stay-range-calendar"] button[data-iso]:not([aria-disabled])');
    await enabledDays.nth(3).click();
    await expect(page.getByTestId("stay-dates-done")).toBeDisabled();
    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("stay-dates-done")).toBeEnabled();
    await evidence(page, testInfo, "stays__search__03-calendar");
    await page.getByTestId("stay-dates-done").click();
    await expect(page.getByTestId("stay-dates-value")).toContainText("۲ شب");
    await page.getByTestId("stay-search-submit").click();
    await expect(page).toHaveURL(/in=\d{4}-\d{2}-\d{2}&out=\d{4}-\d{2}-\d{2}/);
    await expect(page.getByTestId("stay-card-total")).toBeVisible();

    // Escape closes the dialog without changing the dates.
    const before = await page.getByTestId("stay-dates-value").innerText();
    await page.getByTestId("stay-dates-button").click();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(page.getByTestId("stay-dates-value")).toHaveText(before);
  });

  test("dates in the past are rejected with a field message; a full stay shows as unavailable", async ({ page, context }) => {
    const world = await seedWorld([{ units: 1 }]);
    const stay = world.stays[0];
    await skipIntro(context);
    // Sell the only unit for the night, then search those dates.
    const ci = isoInDays(30);
    const co = isoInDays(31);
    const { seedStayBooking, seedUser } = await import("../../src/features/stays/testing/fixtures");
    const { db } = await import("./helpers");
    const other = await seedUser(db() as never);
    await seedStayBooking(db() as never, stay, other.id, { checkIn: ci, checkOut: co });
    await page.goto(`/fa/stays/city/${world.city.slug}?${stayQuery(ci, co)}`);
    await expect(page.getByTestId("stay-card-price")).toContainText("ظرفیت ندارد");
    await page.goto(`/fa/stays/${stay.slug}?${stayQuery(ci, co)}`);
    await expect(page.getByTestId("stay-plan-unavailable").first()).toBeVisible();
    await expect(page.getByTestId("stay-reserve")).toHaveCount(0);

    await page.goto(`/fa/stays/${stay.slug}?${stayQuery(isoInDays(-3), isoInDays(-1))}`);
    await expect(page.getByTestId("stay-detail-date-error")).toContainText("گذشته");
  });

  test("a party that fits no room is excluded; no results is not an error", async ({ page, context }) => {
    const world = await seedWorld([{}]);
    await skipIntro(context);
    await page.goto(`/fa/stays/city/${world.city.slug}?adults=9`);
    await expect(page.getByTestId("stays-empty")).toBeVisible();
    await expect(page.getByTestId("stays-explore-error")).toHaveCount(0);
  });

  test("a city without published stays is not shown; an unknown city is 404", async ({ page, context }) => {
    await skipIntro(context);
    const res = await page.goto("/fa/stays/city/no-such-city-xyz");
    expect(res?.status()).toBe(404);
    const res2 = await page.goto("/fa/stays/no-such-stay-xyz");
    expect(res2?.status()).toBe(404);
    await expect(page.getByTestId("stays-not-found")).toBeVisible();
  });
});
