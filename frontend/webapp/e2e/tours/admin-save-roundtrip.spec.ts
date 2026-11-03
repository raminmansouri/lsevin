/**
 * Regression (2026-11-03, reported on lsevin.ir): editing a tour's core facts and a
 * destination's cover image "did not save" — after reopening, nothing had changed.
 * Each test edits through the real UI, saves, reloads, and asserts both the form and
 * the committed database row. Screenshots: loaded → filled → saved → after reload.
 *
 * @regression @critical
 */
import { randomUUID } from "node:crypto";

import { expect, test, type Page, type TestInfo } from "@playwright/test";

import { seedDestination, seedProvider, seedTour, seedUser } from "../../src/features/tours/testing/fixtures";

import { expectToast, signInAdmin } from "./admin-helpers";
import { closeDb, db } from "./support/db";

test.afterAll(closeDb);
test.describe.configure({ timeout: 300_000 });

async function evidence(page: Page, testInfo: TestInfo, scenario: string, step: string) {
  const name = `tours-admin-save__${scenario}__${step}`;
  const file = testInfo.outputPath(`${name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  await testInfo.attach(name, { path: file, contentType: "image/png" });
}

/** Fails the test on any server error or unexpected failed request while editing. */
function watchFailures(page: Page) {
  const failures: string[] = [];
  page.on("response", (r) => {
    if (r.status() >= 500 && new URL(r.url()).origin === new URL(page.url()).origin) failures.push(`HTTP ${r.status()} ${r.url()}`);
  });
  page.on("pageerror", (e) => failures.push(`pageerror: ${e.message}`));
  return failures;
}

test.beforeEach(({}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "admin data entry is desktop work");
});

test("a new tour's core facts are saved and shown after reload @regression @critical", async ({ page, context }, testInfo) => {
  const sql = db();
  const slug = `e2e-save-${randomUUID().slice(0, 8)}`;
  const failures = watchFailures(page);
  await signInAdmin(context);

  // Create the tour the way an admin does (empty duration, languages, categories).
  await page.goto("/en/admin/tours-platform/tours");
  await page.getByText("Create a tour for a provider").click();
  await page.getByTestId("c-provider").click();
  // The showcase provider from migration 0083 (the e2e database holds thousands of fixture providers).
  await page.getByRole("option", { name: /Lsevin Tours/ }).click();
  await page.locator("#c-slug").fill(slug);
  await page.locator("#c-title").fill("تور آزمایشی ذخیره");
  await page.getByRole("button", { name: "Create draft" }).click();
  await page.waitForURL(/\/tours-platform\/tours\/[0-9a-f-]{36}/);
  const tourId = page.url().match(/tours\/([0-9a-f-]{36})/)![1];
  await expect(page.locator("#core-durationMinutes")).toBeVisible();
  await evidence(page, testInfo, "tour-facts", "01-loaded");

  // Edit: duration, participants, guide languages, a category.
  await page.locator("#core-durationMinutes").fill("240");
  await page.locator("#core-maxParticipants").fill("14");
  await page.getByTestId("core-langs").click();
  await page.getByRole("listbox").getByRole("option", { name: /^فارسی/ }).click();
  await page.keyboard.press("Escape");
  await page.getByTestId("core-categories").click();
  await page.getByRole("listbox").getByRole("option").first().click();
  await page.keyboard.press("Escape");
  // The edits are marked as unsaved, and leaving warns instead of silently dropping them
  // (the reported loss: an admin pressed "Save placement" further down and moved on).
  await expect(page.getByTestId("save-core-unsaved")).toBeVisible();
  await evidence(page, testInfo, "tour-facts", "02-filled");
  let warned = "";
  page.once("dialog", async (d) => { warned = d.message(); await d.dismiss(); });
  await page.getByRole("link", { name: "Media" }).click();
  expect(warned).toContain("unsaved");
  await expect(page.locator("#core-durationMinutes")).toHaveValue("240");

  // Save with the button at the end of the facts (next to where editing ends).
  await page.getByTestId("save-core").click();
  await expectToast(page);
  await expect(page.getByTestId("save-core-unsaved")).toHaveCount(0);
  await evidence(page, testInfo, "tour-facts", "03-saved");

  // Persisted: the row and the reopened form.
  const [row] = await sql<{ duration_minutes: number | null; max_participants: number | null; guide_languages: string[]; category_codes: string[] }[]>`
    select duration_minutes, max_participants, guide_languages, category_codes from tour.tours where id = ${tourId}`;
  expect(row).toMatchObject({ duration_minutes: 240, max_participants: 14, guide_languages: ["fa"] });
  expect(row.category_codes.length).toBe(1);
  await page.reload();
  await expect(page.locator("#core-durationMinutes")).toHaveValue("240");
  await expect(page.locator("#core-maxParticipants")).toHaveValue("14");
  await expect(page.getByTestId("core-langs")).toContainText("فارسی");
  await evidence(page, testInfo, "tour-facts", "04-after-reload");
  expect(failures).toEqual([]);
});

test("a destination's cover picked from the media library is saved and shown after reload @regression @critical", async ({ page, context }, testInfo) => {
  const sql = db();
  const dest = await seedDestination(sql);
  await sql`update tour.destinations set cover_url = null, cover_alt_translations = '{}' where id = ${dest.id}`;
  const fileName = `d${randomUUID().slice(0, 5)}.jpg`;
  // A storage-relative library path, as production's media library stores them. It resolves
  // against NEXT_PUBLIC_FILES_URL; this file is a public image on that host (read-only fetch).
  const libraryPath = "Categories/services/01a1a191-ce0a-1504-926e-34eb52cfce08.webp";
  await sql`
    insert into media.media_library (original_name, stored_name, file_url, mime_type, extension, media_type, file_size, width, height)
    values (${fileName}, ${fileName}, ${libraryPath}, 'image/webp', 'webp', 'image', 151000, 1600, 1200)`;
  const failures = watchFailures(page);
  await signInAdmin(context);

  await page.goto("/en/admin/tours-platform/destinations");
  await expect(async () => {
    await page.locator(`tr[data-slug="${dest.slug}"]`).getByRole("button", { name: "Edit" }).click();
    await expect(page.locator("#dst-slug")).toHaveValue(dest.slug, { timeout: 3_000 });
  }).toPass({ timeout: 60_000 });
  await evidence(page, testInfo, "destination-cover", "01-loaded");

  await page.locator("#dst-cover").getByRole("button", { name: /Pick file|Choose|Change selection/ }).click();
  await page.getByRole("button", { name: new RegExp(`^${fileName}`) }).click();
  // The picked image shows in the form before saving.
  await expect(page.locator("#dst-cover img").first()).toBeVisible();
  await page.getByTestId("dst-cover-alt").getByRole("tab", { name: /^English/ }).click();
  await page.getByTestId("dst-cover-alt").getByRole("textbox").fill("Windcatchers of Yazd");
  await evidence(page, testInfo, "destination-cover", "02-filled");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expectToast(page);
  await evidence(page, testInfo, "destination-cover", "03-saved");

  const [row] = await sql<{ cover_url: string | null }[]>`select cover_url from tour.destinations where id = ${dest.id}`;
  // Stored as the library path (not "https://<this site's files host>/files/…").
  expect(row.cover_url).toBe(libraryPath);

  // Reopen: the form shows the saved image (not "No file selected").
  await page.reload();
  await expect(async () => {
    await page.locator(`tr[data-slug="${dest.slug}"]`).getByRole("button", { name: "Edit" }).click();
    await expect(page.locator("#dst-slug")).toHaveValue(dest.slug, { timeout: 3_000 });
  }).toPass({ timeout: 60_000 });
  const preview = page.locator("#dst-cover img").first();
  await expect(preview).toBeVisible();
  await expect.poll(() => preview.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
  await evidence(page, testInfo, "destination-cover", "04-after-reload");

  // Customers see the image too (resolved for this site when displayed). A destination is
  // listed only with a published tour, so publish one there.
  await sql`update tour.destinations set is_published = true where id = ${dest.id}`;
  const owner = await seedUser(sql);
  const provider = await seedProvider(sql, owner.id);
  await seedTour(sql, { providerId: provider.id, destinationId: dest.id });
  await context.addCookies([{ name: "tours_intro_done", value: "1", url: page.url() }]);
  await page.goto(`/en/tours/destinations/${dest.slug}`);
  const cover = page.locator(`img[src$="${libraryPath}"]`).first();
  await expect(cover).toBeVisible();
  await expect.poll(() => cover.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
  await evidence(page, testInfo, "destination-cover", "05-customer-page");
  expect(failures).toEqual([]);
});
