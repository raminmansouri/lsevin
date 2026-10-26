/**
 * AT-30 Accessibility: keyboard-only calendar and booking, labelled controls,
 * focus trapped in dialogs, text alternative for the itinerary map.
 * AT-25 Permissions: denying location keeps discovery and booking working.
 */
import { expect, test, type Page } from "@playwright/test";

import { bookUrl, seedCatalog, signedInCustomer, skipIntro, streamSettled } from "./customer-helpers";
import { closeDb } from "./support/db";

test.afterAll(closeDb);
// First hits compile routes on the dev server (Turbopack can take minutes).
test.describe.configure({ timeout: 360_000 });

const addDays = (iso: string, n: number) => {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
const focusedIso = (page: Page) => page.evaluate(() => (document.activeElement as HTMLElement | null)?.getAttribute("data-iso") ?? null);

test("keyboard-only calendar navigation, selection and travelers", async ({ page, context }) => {
  const c = await seedCatalog([{ firstDepartureInDays: 5, departures: 5 }]);
  const tour = c.tours[0];
  await signedInCustomer(context);
  await skipIntro(context);
  await page.goto(bookUrl("en", tour.slug));
  const cal = page.getByTestId("departure-calendar");
  await cal.waitFor();

  // Exactly one day is in the tab order (roving tabindex).
  await expect(cal.locator('button[data-iso][tabindex="0"]')).toHaveCount(1);
  await cal.locator('button[data-iso][tabindex="0"]').focus();
  const start = (await focusedIso(page))!;
  await page.keyboard.press("ArrowRight");
  expect(await focusedIso(page)).toBe(addDays(start, 1));
  await page.keyboard.press("ArrowDown");
  expect(await focusedIso(page)).toBe(addDays(start, 8));
  await page.keyboard.press("ArrowUp");
  await page.keyboard.press("ArrowLeft");
  expect(await focusedIso(page)).toBe(start);
  const title = await page.getByTestId("calendar-month-title").innerText();
  await page.keyboard.press("PageDown");
  await expect(page.getByTestId("calendar-month-title")).not.toHaveText(title);
  await page.keyboard.press("PageUp");
  await expect(page.getByTestId("calendar-month-title")).toHaveText(title);
  expect(await focusedIso(page)).toBe(start);

  // Move with arrows to the first bookable day and select it with Enter.
  const firstAvailable = await cal.locator('button[data-state="available"]').first().getAttribute("data-iso");
  for (let i = 0; i < 40 && (await focusedIso(page)) !== firstAvailable; i += 1) {
    await page.keyboard.press((await focusedIso(page))! < firstAvailable! ? "ArrowRight" : "ArrowLeft");
  }
  const label = await page.evaluate(() => document.activeElement?.getAttribute("aria-label") ?? "");
  expect(label).toMatch(/\d{4}/); // full date incl. year
  expect(label).toMatch(/seat/); // status for screen readers
  await page.keyboard.press("Enter");
  await expect(cal.locator(`[role=gridcell][aria-selected=true] button[data-iso="${firstAvailable}"]`)).toHaveCount(1);
  await expect(page.getByTestId("selected-departure")).toBeVisible();

  // Continue and use the stepper from the keyboard.
  await page.getByTestId("continue").focus();
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("booking-flow")).toHaveAttribute("data-step", "travelers");
  await page.getByTestId("inc-adult").focus();
  await page.keyboard.press("Space");
  await expect(page.getByTestId("count-adult")).toHaveText("2");
  await expect(page.getByTestId("quote-total")).toBeVisible();
  await expect(page.getByRole("button", { name: "Add one Adult" })).toBeVisible();
  await page.getByTestId("continue").focus();
  await page.keyboard.press("Enter");

  // Every form control in the details step has an accessible name.
  await page.getByTestId("details-step").waitFor();
  const unnamed = await page.getByTestId("details-step").locator("input, select, textarea").evaluateAll((els) =>
    els.filter((el) => {
      const id = el.getAttribute("id");
      const labelled = (id && document.querySelector(`label[for="${id}"]`)) || el.closest("label") || el.getAttribute("aria-label");
      return !labelled;
    }).length,
  );
  expect(unnamed).toBe(0);
});

test("dialogs trap focus; map has a text alternative", async ({ page, context }) => {
  const c = await seedCatalog([{ days: 2, images: 3 }]);
  await skipIntro(context);
  await page.goto(`/en/tours/t/${c.tours[0].slug}`);

  const trigger = page.getByRole("button", { name: "Open photo 1 of 3 in full screen" }).first();
  await trigger.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("lightbox")).toBeVisible();
  for (let i = 0; i < 8; i += 1) {
    await page.keyboard.press("Tab");
    const inside = await page.evaluate(() => Boolean(document.activeElement?.closest("[role=dialog]")));
    expect(inside).toBe(true);
  }
  await page.keyboard.press("Escape");
  await expect(page.getByTestId("lightbox")).toHaveCount(0);

  const alt = page.getByRole("region", { name: "Stops in order" });
  await expect(alt).toBeVisible();
  await expect(alt.getByTestId("itinerary-stop")).toHaveCount(5);
  // Tabs/anchors navigation is labelled and reachable.
  await expect(page.getByRole("navigation", { name: "Tour sections" }).getByRole("link", { name: "Itinerary" })).toBeVisible();
});

test("AT-25: denied location permission — discovery and booking still work", async ({ browser }) => {
  const c = await seedCatalog([{ firstDepartureInDays: 6 }]);
  const context = await browser.newContext({ permissions: [] });
  await signedInCustomer(context);
  await skipIntro(context);
  const page = await context.newPage();
  await page.goto(`/en/tours/explore?destination=${c.destination.slug}`);
  await streamSettled(page);
  await page.getByTestId("nearby").click();
  await expect(page.getByTestId("nearby-status")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId("tour-card")).toHaveCount(1);
  await page.getByTestId("tour-card-link").first().click();
  await expect(page.getByTestId("itinerary")).toBeVisible();
  await page.goto(bookUrl("en", c.tours[0].slug, c.tours[0].departureIds[0]));
  await expect(page.getByTestId("quote-total")).toBeVisible();
  await page.getByTestId("continue").click();
  await expect(page.getByTestId("details-step")).toBeVisible();
  await context.close();
});
