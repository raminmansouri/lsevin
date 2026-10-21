/**
 * Multilingual + three calendars:
 *   AT-22/AT-35/AT-41 the same departure in Jalali, Gregorian and lunar Hijri keeps id, price, seats and time
 *   AT-24 fa/ar RTL, en/tr LTR with localized digits; browse → book → voucher in fa and en
 *   AT-31/AT-40 switching language keeps the page, the selected departure, entered travelers and currency;
 *               switching calendar changes nothing else
 *   AT-44 mixed Persian/Latin names, Latin voucher codes and phone numbers stay readable (bidi isolation)
 */
import { expect, test, type Page } from "@playwright/test";

import { bookUrl, fillAndConfirm, fillDetailsAndConfirm, seedCatalog, signedInCustomer, skipIntro } from "./customer-helpers";
import { closeDb } from "./support/db";

test.afterAll(closeDb);
test.describe.configure({ timeout: 360_000 });

async function selected(page: Page) {
  const box = page.getByTestId("selected-departure");
  await box.waitFor();
  return {
    id: await box.getAttribute("data-departure-id"),
    iso: await box.getAttribute("data-local-date"),
    date: (await page.getByTestId("selected-date").innerText()).trim(),
    time: (await page.getByTestId("selected-time").innerText()).trim(),
    seats: (await page.getByTestId("selected-seats").innerText()).trim(),
    price: (await page.getByTestId("selected-price").innerText()).trim(),
    cell: await page.getByTestId("departure-calendar").locator('button[data-selected="true"]').getAttribute("data-iso"),
    month: (await page.getByTestId("calendar-month-title").innerText()).trim(),
  };
}

async function chooseCalendar(page: Page, id: "persian" | "gregory" | "islamic-umalqura") {
  await page.getByTestId("booking-flow").locator("label", { has: page.getByTestId(`calendar-option-${id}`) }).click();
  await expect(page.getByTestId("departure-calendar")).toHaveAttribute("data-calendar", id);
}

test("AT-22/AT-35/AT-41: one departure, three calendars, identical facts", async ({ page, context }) => {
  const c = await seedCatalog([{ firstDepartureInDays: 12, localTime: "07:30", adultPrice: 9_500_000 }]);
  const tour = c.tours[0];
  await skipIntro(context);
  await page.goto(bookUrl("en", tour.slug, tour.departureIds[0]));
  await page.getByTestId("selected-summary").click();
  await expect(page.getByTestId("booking-flow")).toHaveAttribute("data-step", "date");

  await chooseCalendar(page, "gregory");
  const g = await selected(page);
  await chooseCalendar(page, "persian");
  const p = await selected(page);
  await chooseCalendar(page, "islamic-umalqura");
  const h = await selected(page);

  for (const x of [p, h]) {
    expect(x.id).toBe(g.id);
    expect(x.iso).toBe(g.iso);
    expect(x.cell).toBe(g.iso);
    expect(x.time).toBe(g.time);
    expect(x.seats).toBe(g.seats);
    expect(x.price).toBe(g.price);
  }
  expect(g.id).toBe(tour.departureIds[0]);
  // The displayed date and month really are in different calendars.
  expect(new Set([g.date, p.date, h.date]).size).toBe(3);
  expect(new Set([g.month, p.month, h.month]).size).toBe(3);
  expect(g.time).toContain("07:30");
  expect(g.price).toContain("9,500,000");
});

for (const [locale, dir, digits] of [
  ["fa", "rtl", /[۰-۹]/],
  ["ar", "rtl", /[٠-٩]/],
  ["en", "ltr", /[0-9]/],
  ["tr", "ltr", /[0-9]/],
] as const) {
  test(`AT-24: ${locale} direction and digits`, async ({ page, context }) => {
    const c = await seedCatalog([{ adultPrice: 12_000_000 }]);
    await skipIntro(context);
    await page.goto(`/${locale}/tours/explore?destination=${c.destination.slug}`);
    await expect(page.getByTestId("tours-shell")).toHaveAttribute("dir", dir);
    await expect(page.getByTestId("tours-shell")).toHaveAttribute("lang", locale);
    const price = (await page.getByTestId("tour-card").first().getByTestId("from-price").innerText()).trim();
    expect(price).toMatch(digits);
    if (locale === "fa") expect(price).not.toMatch(/[0-9]/);
    const text = await page.locator("main").innerText();
    expect(text).not.toMatch(/TourApp\.|TourShared\.|MISSING_MESSAGE/);
  });
}

for (const locale of ["fa", "en"] as const) {
  test(`AT-24: browse → book → voucher in ${locale}, with localized validation errors`, async ({ page, context }) => {
    const c = await seedCatalog([{ adultPrice: 0, childPrice: 0, firstDepartureInDays: 7 }]);
    await signedInCustomer(context);
    await skipIntro(context);
    await page.goto(`/${locale}/tours/explore?destination=${c.destination.slug}`);
    await page.getByTestId("tour-card-link").first().click();
    await page.getByTestId("book-now").click();
    const cal = page.getByTestId("departure-calendar");
    await cal.locator('button[data-state="available"]').first().click();
    await page.getByTestId("continue").click();
    await page.getByTestId("quote-total").waitFor();
    await page.getByTestId("continue").click();
    // Submitting empty details → localized, field-level errors (no raw codes).
    await page.getByTestId("details-step").waitFor();
    await page.getByTestId("continue").click();
    const err = page.getByTestId("tours-error").first();
    await expect(err).toBeVisible();
    await expect(err).toHaveAttribute("data-error-code", "invalid_guest_details");
    expect((await err.innerText()).trim()).not.toContain("invalid_guest_details");
    await expect(page.locator('[aria-invalid="true"]').first()).toBeVisible();
    // Mixed scripts in names (AT-44).
    await fillDetailsAndConfirm(page, { buyer: { firstName: "سارا", lastName: "Smith", phone: "+989121234567" }, travelers: [{ firstName: "سارا", lastName: "Smith" }] });
    await page.getByTestId("view-voucher").click();
    await expect(page.getByTestId("voucher")).toHaveAttribute("data-status", "confirmed");
    const code = page.getByTestId("voucher-code");
    await expect(code).toHaveAttribute("dir", "ltr");
    expect((await code.innerText()).trim()).toMatch(/^TR-[A-Z0-9]{8}$/);
    await expect(page.getByTestId("voucher-attendees")).toContainText("سارا Smith");
    await expect(page.getByTestId("booking-id")).toHaveAttribute("dir", "ltr");
  });
}

test("AT-31/AT-40: language switch keeps departure, travelers and currency; calendar switch changes nothing else", async ({ page, context }) => {
  const c = await seedCatalog([{ firstDepartureInDays: 9 }]);
  const tour = c.tours[0];
  await signedInCustomer(context);
  await skipIntro(context);

  // Details page: pick a display currency, then switch language → same tour, same currency.
  await page.goto(`/en/tours/t/${tour.slug}`);
  await page.getByTestId("display-settings").click();
  // The preference is saved by a server action; let it land before navigating.
  await Promise.all([
    page.waitForResponse((r) => r.request().method() === "POST" && r.url().includes("/tours/t/")),
    page.getByTestId("currency-select").selectOption("USD"),
  ]);
  await page.getByTestId("language-select").selectOption("fa");
  await expect(page).toHaveURL(new RegExp(`/fa/tours/t/${tour.slug}`));
  await expect(page.getByTestId("tour-detail")).toBeVisible();
  await page.getByTestId("display-settings").click();
  await expect(page.getByTestId("currency-select")).toHaveValue("USD");
  await page.keyboard.press("Escape");

  // Checkout: enter traveler data, switch language → same step, departure and data.
  // (The explicit language choice above is remembered in NEXT_LOCALE, so we continue in fa.)
  await page.goto(bookUrl("fa", tour.slug, tour.departureIds[1]));
  await fillAndConfirm(page, { confirm: false, travelers: [{ firstName: "Leyla", lastName: "Ahmadi" }] });
  await page.getByTestId("step-back").click();
  await expect(page.getByTestId("details-step")).toBeVisible();
  await page.getByTestId("display-settings").click();
  await page.getByTestId("language-select").selectOption("tr");
  await expect(page).toHaveURL(new RegExp(`/tr/tours/t/${tour.slug}/book\\?departure=${tour.departureIds[1]}`));
  await expect(page.getByTestId("details-step")).toBeVisible();
  await expect(page.getByTestId("participant").first().locator("input[type=text]").first()).toHaveValue("Leyla");
  await expect(page.getByTestId("tours-shell")).toHaveAttribute("dir", "ltr");

  // Calendar only: language and currency stay.
  await page.getByTestId("display-settings").click();
  await page.getByRole("dialog").locator("label", { has: page.getByTestId("calendar-option-islamic-umalqura") }).click();
  await expect(page.getByTestId("currency-select")).toHaveValue("USD");
  await expect(page.getByTestId("language-select")).toHaveValue("tr");
  await page.keyboard.press("Escape");
  await expect(page).toHaveURL(/\/tr\/tours\//);
  await expect(page.getByTestId("participant").first().locator("input[type=text]").first()).toHaveValue("Leyla");
});

test("guest display preferences persist across reloads and languages (regression: double-encoded prefs cookie)", async ({ page, context }) => {
  await skipIntro(context);
  await page.goto("/en/tours/explore");
  await page.getByTestId("display-settings").click();
  await page.getByRole("dialog").locator("label", { has: page.getByTestId("calendar-option-persian") }).click();
  await page.getByTestId("currency-select").selectOption("EUR");
  // Switching language waits for the pending saves (flush) before navigating.
  await page.getByTestId("language-select").selectOption("ar");
  await expect(page).toHaveURL(/\/ar\/tours\/explore/);
  await page.reload();
  await page.getByTestId("display-settings").click();
  await expect(page.getByRole("dialog").getByTestId("calendar-option-persian")).toBeChecked();
  await expect(page.getByTestId("currency-select")).toHaveValue("EUR");
  await expect(page.getByTestId("language-select")).toHaveValue("ar");
});
