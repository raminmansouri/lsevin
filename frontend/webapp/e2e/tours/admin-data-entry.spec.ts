/**
 * Admin data entry (2026-10-28 request): menus in data-entry order, editable and
 * localized categories (they used to show in English on Persian screens),
 * thousands-separated prices in ریال, Jalali dates, and rich-text descriptions
 * that customers see as text, not Lexical JSON. Screenshots are attached.
 *
 * @regression
 */
import { randomUUID } from "node:crypto";

import { expect, test, type Page, type TestInfo } from "@playwright/test";

import { seedDestination, seedProvider, seedTour, seedUser } from "../../src/features/tours/testing/fixtures";

import { expectToast, fillLocalized, signInAdmin, skipIntro } from "./admin-helpers";
import { closeDb, db } from "./support/db";

test.afterAll(closeDb);
test.describe.configure({ timeout: 300_000 });

async function evidence(page: Page, testInfo: TestInfo, scenario: string, step: string) {
  const name = `tours-admin-data-entry__${scenario}__${step}`;
  const file = testInfo.outputPath(`${name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  await testInfo.attach(name, { path: file, contentType: "image/png" });
}

test.beforeEach(({}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "admin screens are desktop work");
});

test("setup menu runs in data-entry order, numbered @regression", async ({ page, context }, testInfo) => {
  await signInAdmin(context);
  await page.goto("/fa/admin/tours-platform");
  const setup = page.getByTestId("nav-group-setup").getByRole("link");
  const hrefs = await setup.evaluateAll((links) => links.map((a) => new URL((a as HTMLAnchorElement).href).pathname.replace(/^\/fa/, "")));
  expect(hrefs).toEqual([
    "/admin/tours-platform/settings",
    "/admin/tours-platform/taxonomy",
    "/admin/tours-platform/destinations",
    "/admin/tours-platform/tours",
    "/admin/tours-platform/translations",
    "/admin/tours-platform/editorial",
  ]);
  await expect(setup.first()).toContainText("۱");
  await expect(page.getByTestId("nav-group-setup")).toContainText("دسته‌ها و برچسب‌ها");
  await evidence(page, testInfo, "menu", "01-setup-order");
});

test("a category is created in Persian and English and shows in Persian on Persian screens @regression @critical", async ({ page, context }, testInfo) => {
  const sql = db();
  const code = `e2e_${randomUUID().slice(0, 8)}`;
  // Letters only: admin screens render digits in Persian, so a Latin digit would not match.
  const fa = `دسته آزمایشی ${["الف", "ب", "پ", "ت", "ث", "ج"][Math.floor(Math.random() * 6)]}${["ح", "خ", "د", "ذ", "ر", "ز"][Math.floor(Math.random() * 6)]}`;
  await signInAdmin(context);

  // Create (English admin UI), both languages in the one multi-language control.
  await page.goto("/en/admin/tours-platform/taxonomy");
  await expect(page.getByTestId("taxonomy-intro")).toBeVisible();
  await page.locator("#term-code").fill(code);
  await fillLocalized(page, "Label", "en-US", `E2E category ${code}`);
  await fillLocalized(page, "Label", "fa-IR", fa);
  await evidence(page, testInfo, "category", "01-filled");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expectToast(page);
  const [row] = await sql<{ label_translations: Record<string, string> }[]>`
    select label_translations from tour.taxonomy_terms where kind = 'category' and code = ${code}`;
  expect(row.label_translations).toMatchObject({ "fa-IR": fa, "en-US": `E2E category ${code}` });

  // Persian admin shows the Persian label, after a refresh too.
  await page.goto("/fa/admin/tours-platform/taxonomy");
  await page.reload();
  await expect(page.locator(`tr[data-code="${code}"]`)).toContainText(fa);
  await evidence(page, testInfo, "category", "02-persian-list");

  // The tour editor's category selector offers Persian labels (not "Culture & history").
  const owner = await seedUser(sql);
  const p = await seedProvider(sql, owner.id);
  const t = await seedTour(sql, { providerId: p.id });
  await page.goto(`/fa/admin/tours-platform/tours/${t.id}?tab=overview`);
  const categories = page.getByTestId("core-categories");
  await expect(categories).toContainText("فرهنگی و تاریخی");
  await expect(categories).not.toContainText("Culture");
  await categories.click();
  await expect(page.getByRole("option", { name: new RegExp(fa) })).toBeVisible();
  await evidence(page, testInfo, "category", "03-editor-selector");
  await page.keyboard.press("Escape");

  // Deactivate instead of delete.
  await page.goto("/en/admin/tours-platform/taxonomy");
  await page.locator(`tr[data-code="${code}"]`).getByRole("button", { name: "Deactivate" }).click();
  await expectToast(page);
  await expect(page.locator(`tr[data-code="${code}"]`)).toHaveAttribute("data-active", "false");
});

test("prices are thousands-separated in ریال and dates are Jalali @regression", async ({ page, context }, testInfo) => {
  const sql = db();
  const owner = await seedUser(sql);
  const p = await seedProvider(sql, owner.id);
  const t = await seedTour(sql, { providerId: p.id, adultPrice: 12_000_000 });
  await signInAdmin(context);

  await page.goto(`/fa/admin/tours-platform/tours/${t.id}?tab=pricing`);
  await expect(page.locator("#op-0-adult")).toHaveValue("12,000,000");
  await expect(page.locator("body")).toContainText("ریال");
  await expect(page.locator("body")).not.toContainText("IRR");
  await evidence(page, testInfo, "money", "01-pricing-tab");

  // Published/updated dates in the tours list are Jalali (year 14xx in Persian digits).
  await page.goto(`/fa/admin/tours-platform/tours?q=${encodeURIComponent(t.slug)}`);
  const tourRow = page.locator(`tr[data-tour-slug="${t.slug}"]`);
  await expect(tourRow).toContainText(/۱۴[۰-۹]{2}/);
  await evidence(page, testInfo, "dates", "02-tours-list");
});

test("a rich-text destination description reaches customers as text @regression", async ({ page, context }, testInfo) => {
  const sql = db();
  const owner = await seedUser(sql);
  const p = await seedProvider(sql, owner.id);
  const dest = await seedDestination(sql);
  const lexical = JSON.stringify({
    root: { type: "root", version: 1, direction: "rtl", format: "", indent: 0, children: [
      { type: "paragraph", version: 1, direction: "rtl", format: "", indent: 0, textFormat: 0, textStyle: "",
        children: [{ type: "text", version: 1, text: "شهر شعر و باغ", format: 1, detail: 0, mode: "normal", style: "" }] },
    ] },
  });
  await sql`update tour.destinations set description_translations = ${sql.json({ "fa-IR": lexical })} where id = ${dest.id}`;
  await seedTour(sql, { providerId: p.id, destinationId: dest.id });
  await skipIntro(context);

  await page.goto(`/fa/tours/destinations/${dest.slug}`);
  await expect(page.getByText("شهر شعر و باغ")).toBeVisible();
  await expect(page.locator("body")).not.toContainText('"root"');
  await page.reload();
  await expect(page.getByText("شهر شعر و باغ")).toBeVisible();
  await evidence(page, testInfo, "rich-text", "01-customer-destination");
});
