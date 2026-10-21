/**
 * AT-06 Search (C-021..C-027): destination + date range + party size return only
 * tours with an eligible departure; changing the sort keeps the filters; the URL
 * is shareable (reload / new context gives the same results); unavailable
 * results are labelled, not hidden, when asked for.
 */
import { expect, test, type Page } from "@playwright/test";

import { pickIso, seedCatalog, skipIntro } from "./customer-helpers";
import { closeDb, db } from "./support/db";

test.afterAll(closeDb);
// First hits compile routes on the dev server (Turbopack can take minutes).
test.describe.configure({ timeout: 360_000 });

async function slugs(page: Page) {
  await page.getByTestId("tours-shell").getByTestId("results-count").waitFor();
  return page.getByTestId("tours-shell").getByTestId("tour-card").evaluateAll((els) => els.map((e) => e.getAttribute("data-tour-slug")).sort());
}

test("filters, sort and shareable URL", async ({ page, context, browser }) => {
  const c = await seedCatalog([
    { firstDepartureInDays: 3, departures: 5, capacity: 10, titles: { "fa-IR": "تور یک", "en-US": "Eligible tour" } },
    { firstDepartureInDays: 25, departures: 3, capacity: 10, titles: { "fa-IR": "تور دو", "en-US": "Later tour" } },
    { firstDepartureInDays: 3, departures: 5, capacity: 2, titles: { "fa-IR": "تور سه", "en-US": "Small group tour" } },
  ]);
  const [eligible, later, small] = c.tours;
  const deps = await db()<{ d: string }[]>`select starts_on::text as d from tour.departures where tour_id = ${eligible.id}::uuid order by starts_on`;
  const from = deps[0].d;
  const to = deps[deps.length - 1].d;
  await skipIntro(context);

  await page.goto("/en/tours/explore");
  await page.getByTestId("open-filters").click();
  await page.getByTestId("filter-destination").selectOption(c.destination.slug);
  const dates = page.getByTestId("filter-dates");
  await pickIso(page, dates, from);
  await pickIso(page, dates, to);
  for (let i = 0; i < 3; i += 1) await page.getByTestId("filter-party-inc").click();
  await expect(page.getByTestId("filter-party")).toHaveText("3");
  await page.getByTestId("apply-filters").click();

  await expect(page).toHaveURL(new RegExp(`destination=${c.destination.slug}`));
  await expect(page).toHaveURL(/party=3/);
  await expect(page).toHaveURL(new RegExp(`from=${from}`));
  expect(await slugs(page)).toEqual([eligible.slug]);

  // Changing the sort keeps every filter.
  await page.getByTestId("sort-select").selectOption("price_desc");
  await expect(page).toHaveURL(/sort=price_desc/);
  await expect(page).toHaveURL(/party=3/);
  await expect(page).toHaveURL(new RegExp(`to=${to}`));
  expect(await slugs(page)).toEqual([eligible.slug]);
  const shared = page.url();

  // Reload and a different visitor opening the shared URL get the same results.
  await page.reload();
  expect(await slugs(page)).toEqual([eligible.slug]);
  const other = await browser.newContext();
  const otherPage = await other.newPage();
  await otherPage.goto(shared);
  expect(await slugs(otherPage)).toEqual([eligible.slug]);
  await other.close();

  // Asking for all results labels the ineligible ones instead of hiding them (C-026).
  await page.getByTestId("show-unavailable").click();
  await expect(page).toHaveURL(/all=1/);
  const all = await slugs(page);
  expect(all).toEqual([eligible.slug, later.slug, small.slug].sort());
  await expect(page.locator(`[data-tour-slug="${later.slug}"]`).getByTestId("card-unavailable")).toBeVisible();
  await expect(page.locator(`[data-tour-slug="${eligible.slug}"]`).getByTestId("card-unavailable")).toHaveCount(0);
});

test("text search, category chip and empty state", async ({ page, context }) => {
  const c = await seedCatalog([{ titles: { "fa-IR": "تور کویر مرنجاب", "en-US": "Maranjab desert tour" }, categories: ["nature"] }]);
  await skipIntro(context);
  // Persian letter variants (Arabic yeh/kaf) still match (C-023).
  await page.goto(`/fa/tours/explore?destination=${c.destination.slug}`);
  await page.locator("#explore-q").fill("كوير");
  await page.locator("#explore-q").press("Enter");
  await expect(page).toHaveURL(/q=/);
  expect(await slugs(page)).toEqual([c.tours[0].slug]);

  await page.goto(`/en/tours/explore?destination=${c.destination.slug}`);
  await page.getByTestId("tours-shell").getByTestId("category-chip-nature").click();
  await expect(page).toHaveURL(/category=nature/);
  expect(await slugs(page)).toEqual([c.tours[0].slug]);
  await page.getByTestId("tours-shell").getByTestId("category-chip-food").click();
  await expect(page.getByTestId("no-results")).toBeVisible();
});

test("recent searches are kept and can be cleared", async ({ page, context }) => {
  const c = await seedCatalog([{}]);
  await skipIntro(context);
  await page.goto(`/en/tours/explore?destination=${c.destination.slug}&q=persepolis`);
  await page.getByTestId("tours-shell").getByTestId("results-count").waitFor();
  // Recorded by a server action after load.
  await page.waitForTimeout(1500);
  await page.goto("/en/tours/explore");
  await expect(page.getByRole("heading", { name: "Recent searches" })).toBeVisible();
  await page.getByTestId("tours-shell").getByTestId("clear-recent-searches").click();
  await expect(page.getByRole("heading", { name: "Recent searches" })).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole("heading", { name: "Recent searches" })).toHaveCount(0);
});
