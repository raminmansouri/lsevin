/**
 * AT-27 Multilingual publishing (M-003, M-010, M-028): change a featured
 * destination and a translated tour title in admin, preview in fa/en/ar and
 * all three calendars, approve, and verify only the intended content is public.
 *   TOURS_E2E_BASE_URL=http://localhost:3031 npx playwright test --config playwright.tours.config.ts admin-multilingual.spec.ts --project desktop
 */
import { expect, test } from "@playwright/test";

import { seedDestination, seedProvider, seedTour, seedUser, suffix } from "../../src/features/tours/testing/fixtures";

import { expectToast, fillLocalized, signInAdmin, skipIntro } from "./admin-helpers";
import { closeDb, db } from "./support/db";

test.afterAll(closeDb);
// Long cross-page workflows; the first compile of each route on the dev server is slow.
test.describe.configure({ timeout: 300_000 });

test("AT-27 destination + translated title: draft only in preview, public after approval, in the right language only", async ({ context, page, browser }) => {
  const sql = db();
  // Letters only: the customer app localizes digits (Persian numerals) on fa pages.
  const s = suffix().replace(/\d/g, (d) => "ghijklmnop"[Number(d)]);
  const owner = await seedUser(sql);
  const p = await seedProvider(sql, owner.id);
  const dest = await seedDestination(sql, { slug: `kish-${s}`, name: { "en-US": `Kish ${s}`, "fa-IR": `کیش ${s}` } });
  await sql`update tour.destinations set is_featured = false, sort_order = -1000 where id = ${dest.id}`;
  const t = await seedTour(sql, { providerId: p.id, destinationId: dest.id, translateTo: ["en-US"], titles: { "fa-IR": `تور دریایی ${s}`, "en-US": `Sea tour ${s}` } });
  const newTitle = `Island day trip ${s}`;

  await signInAdmin(context);

  // 1. Feature the destination (cover alt text is required with a cover image).
  await page.goto("/en/admin/tours-platform/destinations");
  // A click before hydration does nothing; retry until the form shows this destination.
  await expect(async () => {
    await page.locator(`tr[data-slug="${dest.slug}"]`).getByRole("button", { name: "Edit" }).click();
    await expect(page.locator("#dst-slug")).toHaveValue(dest.slug, { timeout: 3_000 });
  }).toPass({ timeout: 60_000 });
  await fillLocalized(page.getByTestId("dst-cover-alt"), "Cover alternative text", "en-US", `Kish coast ${s}`);
  await page.getByLabel("Featured", { exact: true }).check();
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expectToast(page);
  await page.reload();
  await expect(page.locator(`tr[data-slug="${dest.slug}"]`)).toContainText("Featured");
  const [d] = await sql<any[]>`select is_featured, cover_alt_translations from tour.destinations where id = ${dest.id}`;
  expect(d).toMatchObject({ is_featured: true, cover_alt_translations: { "en-US": `Kish coast ${s}` } });

  // 2. Change the English title (a draft until approved).
  await page.goto(`/en/admin/tours-platform/tours/${t.id}?tab=content&locale=en-US`);
  await page.locator("#content-title").fill(newTitle);
  await page.getByTestId("save-content").click();
  await expectToast(page);
  await page.reload();
  await expect(page.locator('[data-field="title"]')).toHaveAttribute("data-status", "draft");
  await expect(page.getByTestId("live-title")).toContainText(`Sea tour ${s}`);

  // Public pages still show the approved title.
  const customer = await browser.newContext();
  await skipIntro(customer);
  const cpage = await customer.newPage();
  await cpage.goto(`/en/tours/t/${t.slug}`);
  await expect(cpage.locator("body")).toContainText(`Sea tour ${s}`);
  await expect(cpage.locator("body")).not.toContainText(newTitle);

  // 3. Preview in en / fa / ar and the three calendars.
  const base = `/en/admin/tours-platform/tours/${t.id}/preview`;
  await page.goto(`${base}?lang=en-US&calendar=gregory&currency=IRR`);
  const view = page.getByTestId("customer-preview");
  await expect(view).toHaveAttribute("dir", "ltr");
  await expect(view.getByRole("heading", { level: 1 })).toContainText(newTitle);
  const isoFirst = await view.getByTestId("preview-departures").locator("li").first().getAttribute("data-iso");
  const gregorian = await view.getByTestId("preview-departures").locator("li").first().innerText();

  await page.goto(`${base}?lang=fa-IR&calendar=persian`);
  await expect(view).toHaveAttribute("dir", "rtl");
  await expect(view.getByRole("heading", { level: 1 })).toContainText(`تور دریایی ${s}`);
  await expect(view.getByTestId("fallback-badge")).toHaveCount(0);
  const persian = await view.getByTestId("preview-departures").locator("li").first().innerText();

  await page.goto(`${base}?lang=ar-SA&calendar=islamic-umalqura`);
  await expect(view).toHaveAttribute("dir", "rtl");
  await expect(view.getByTestId("any-fallback")).toBeVisible();
  await expect(view.getByTestId("fallback-badge").first()).toBeVisible();
  const hijri = await view.getByTestId("preview-departures").locator("li").first().innerText();
  // Same departure, same canonical day, three different calendar renderings.
  expect(await view.getByTestId("preview-departures").locator("li").first().getAttribute("data-iso")).toBe(isoFirst);
  expect(new Set([gregorian, persian, hijri]).size).toBe(3);

  // 4. Approve the English translation.
  await page.goto(`/en/admin/tours-platform/tours/${t.id}?tab=content&locale=en-US`);
  await page.getByTestId("approve-locale").click();
  await expectToast(page, "Approved");
  await page.reload();
  await expect(page.locator('[data-field="title"]')).toHaveAttribute("data-status", "published");

  // 5. Only the intended content is public, per language.
  await cpage.goto(`/en/tours/t/${t.slug}`);
  await expect(cpage.locator("body")).toContainText(newTitle);
  await cpage.goto(`/fa/tours/t/${t.slug}`);
  await expect(cpage.locator("body")).toContainText(`تور دریایی ${s}`);
  await expect(cpage.locator("body")).not.toContainText(newTitle);
  await cpage.goto("/fa/tours");
  await expect(cpage.locator("body")).toContainText(`کیش ${s}`);
  await cpage.goto("/en/tours");
  await expect(cpage.locator("body")).toContainText(`Kish ${s}`);
  await customer.close();
});
