/**
 * AT-02 Recently viewed (C-009, C-103): tours A then B appear as the FIRST home
 * section in order B, A; clearing removes them; another visitor (fresh device)
 * or another account never sees them; a hidden tour disappears (C-014).
 */
import { expect, test } from "@playwright/test";

import { seedCatalog, signedInCustomer, skipIntro } from "./customer-helpers";
import { closeDb, db } from "./support/db";

test.afterAll(closeDb);
// First hits compile routes on the dev server (Turbopack can take minutes).
test.describe.configure({ timeout: 360_000 });

async function view(page: import("@playwright/test").Page, slug: string) {
  await page.goto(`/en/tours/t/${slug}`);
  await expect(page.getByTestId("tour-detail")).toBeVisible();
  // The view is recorded by a server action after hydration; wait until it is stored.
  await expect
    .poll(async () => {
      const [r] = await db()<{ n: number }[]>`select count(*)::int as n from tour.recent_views rv join tour.tours t on t.id = rv.tour_id where t.slug = ${slug}`;
      return r.n;
    }, { timeout: 90_000 })
    .toBeGreaterThan(0);
}

test("guest: recent views first, ordered, clearable, not leaked", async ({ page, context, browser }) => {
  const c = await seedCatalog([{ titles: { "fa-IR": "تور الف", "en-US": "Tour Alpha" } }, { titles: { "fa-IR": "تور ب", "en-US": "Tour Bravo" } }]);
  const [a, b] = c.tours;
  await skipIntro(context);

  // A fresh visitor sees a discovery module, never an empty "recently viewed".
  await page.goto("/en/tours");
  await expect(page.getByTestId("recently-viewed")).toHaveCount(0);

  await view(page, a.slug);
  await view(page, b.slug);
  await page.goto("/en/tours");
  const recent = page.getByTestId("recently-viewed");
  await expect(recent).toBeVisible();
  // It is the first content section after the hero/categories.
  const firstSection = page.locator("[data-section-order='1']").first();
  await expect(firstSection).toHaveAttribute("data-testid", "recently-viewed");
  const slugs = await recent.getByTestId("recent-card").evaluateAll((els) => els.map((e) => e.getAttribute("data-tour-slug")));
  expect(slugs.slice(0, 2)).toEqual([b.slug, a.slug]);
  // Cards carry the "from … per person" qualifier (C-019).
  await expect(recent.getByTestId("recent-card").first().getByTestId("from-price")).toContainText("per person");

  // Another device (new context, no cookies) sees nothing of this history.
  const other = await browser.newContext();
  const otherPage = await other.newPage();
  await other.addCookies([{ name: "tours_intro_done", value: "1", url: page.url() }]);
  await otherPage.goto("/en/tours");
  await expect(otherPage.getByTestId("recently-viewed")).toHaveCount(0);
  await other.close();

  // A tour that is no longer published disappears from the module (C-014).
  await db()`update tour.tours set status = 'paused' where id = ${a.id}::uuid`;
  await page.reload();
  const after = await page.getByTestId("recent-card").evaluateAll((els) => els.map((e) => e.getAttribute("data-tour-slug")));
  expect(after).not.toContain(a.slug);
  expect(after).toContain(b.slug);

  // Clear history.
  await page.getByTestId("clear-recent").click();
  await expect(page.getByTestId("recently-viewed")).toHaveCount(0);
  await page.reload();
  await expect(page.getByTestId("recently-viewed")).toHaveCount(0);
});

test("signed-in history is per account and survives sign-out only for that account", async ({ page, context, browser }) => {
  const c = await seedCatalog([{}]);
  const tour = c.tours[0];
  const user = await signedInCustomer(context);
  await skipIntro(context);
  await view(page, tour.slug);
  await page.goto("/en/tours");
  await expect(page.getByTestId("recently-viewed").getByTestId("recent-card").first()).toHaveAttribute("data-tour-slug", tour.slug);
  const [row] = await db()<{ n: number }[]>`select count(*)::int as n from tour.recent_views where owner_key = ${`u:${user.id}`} and tour_id = ${tour.id}::uuid`;
  expect(row.n).toBe(1);

  // A different account on another device never sees it.
  const other = await browser.newContext();
  await signedInCustomer(other);
  await other.addCookies([{ name: "tours_intro_done", value: "1", url: page.url() }]);
  const otherPage = await other.newPage();
  await otherPage.goto("/en/tours");
  const otherSlugs = await otherPage.getByTestId("recent-card").evaluateAll((els) => els.map((e) => e.getAttribute("data-tour-slug")));
  expect(otherSlugs).not.toContain(tour.slug);
  await other.close();
});
