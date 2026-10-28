/**
 * AT-16 Publish governance: a submitted draft missing policy/media/price is
 * blocked; repaired in the admin editor it passes review and is published;
 * a rejected submission stays unpublished and carries the note for the provider.
 *   TOURS_E2E_BASE_URL=http://localhost:3031 npx playwright test --config playwright.tours.config.ts admin-publish.spec.ts --project desktop
 */
import { randomUUID } from "node:crypto";

import { expect, test } from "@playwright/test";

import { seedProvider, seedTour, seedUser } from "../../src/features/tours/testing/fixtures";

import { editorTab, expectToast, fillLocalized, signInAdmin, skipIntro } from "./admin-helpers";
import { closeDb, db } from "./support/db";

test.afterAll(closeDb);
// Long cross-page workflows; the first compile of each route on the dev server is slow.
test.describe.configure({ timeout: 300_000 });

async function brokenSubmittedTour() {
  const sql = db();
  const owner = await seedUser(sql);
  const p = await seedProvider(sql, owner.id);
  const t = await seedTour(sql, { providerId: p.id, status: "draft", images: 0 });
  // The provider removed the policy and price before submitting (simulated directly).
  await sql`delete from tour.price_tiers where option_id in (select id from tour.options where tour_id = ${t.id})`;
  await sql`update tour.options set private_group_price = null, kind = 'public' where tour_id = ${t.id}`;
  await sql`update tour.tours set current_policy_version = null where id = ${t.id}`;
  await sql`delete from tour.policy_versions where tour_id = ${t.id}`;
  await sql`update tour.tours set status = 'submitted', submitted_at = now() where id = ${t.id}`;
  return t;
}

test("AT-16 missing policy/media/price blocks publication; repaired in admin it publishes and becomes public", async ({ context, page }) => {
  const t = await brokenSubmittedTour();
  await signInAdmin(context);
  await page.goto(`/en/admin/tours-platform/tours?queue=1&q=${t.slug}`);
  await expect(page.getByRole("heading", { name: "Review queue" })).toBeVisible();
  const editorLink = page.locator(`tr[data-tour-slug="${t.slug}"]`).getByRole("link").first();
  await expect(editorLink).toHaveAttribute("href", new RegExp(`/admin/tours-platform/tours/${t.id}$`));
  // On a cold dev compile the click can land before the queue page hydrates and
  // be swallowed; retry the click until navigation actually happens.
  await expect(async () => {
    await editorLink.click();
    await page.waitForURL(new RegExp(`/tours/${t.id}$`), { timeout: 30_000 });
  }).toPass({ timeout: 180_000 });

  const reqs = page.getByTestId("requirements");
  for (const code of ["missing_media", "missing_price", "missing_policy"]) {
    await expect(reqs.locator(`[data-code="${code}"][data-severity="error"]`)).toBeVisible();
  }
  await expect(page.getByTestId("approve-publish")).toBeDisabled();

  // Repair 1: media, picked from the media library (admin-added media is approved immediately).
  // The library item is seeded; its file is a real shipped photo. 10-character name: the picker truncates longer ones.
  const fileName = `r${randomUUID().slice(0, 5)}.jpg`;
  await sql`
    insert into media.media_library (original_name, stored_name, file_url, mime_type, extension, media_type, file_size, width, height)
    values (${fileName}, ${fileName}, '/images/tours/kish-beach.webp', 'image/webp', 'webp', 'image', 101000, 1600, 1200)`;
  await editorTab(page, "Media");
  await page.getByRole("button", { name: "Choose from the media library" }).click();
  await page.getByRole("button", { name: fileName }).click();
  await page.getByRole("button", { name: "Add", exact: true }).click();
  await expectToast(page);
  await expect(page.locator("[data-media-id]")).toHaveCount(1);

  // Repair 2: price.
  await editorTab(page, "Options & prices");
  // The tab mounts a fresh form after a server refresh; a value typed before it
  // settles is reset. Re-type until the value sticks and Save becomes enabled.
  await expect(async () => {
    await page.locator("#op-0-adult").fill("15000000");
    // The amount input shows thousands separators.
    await expect(page.locator("#op-0-adult")).toHaveValue("15,000,000", { timeout: 2_000 });
    await expect(page.getByTestId("save-options")).toBeEnabled({ timeout: 2_000 });
  }).toPass({ timeout: 60_000 });
  await page.getByTestId("save-options").click();
  await expectToast(page);

  // Repair 3: a policy version (source text required).
  await editorTab(page, "Policy");
  // Cancellation text is one multi-language control: open its Persian tab, then type.
  await fillLocalized(page, "Cancellation text", "fa-IR", "تا ۴۸ ساعت قبل بازپرداخت کامل.");
  await page.getByTestId("create-policy").click();
  await expectToast(page, "Policy version created");

  // Requirements met → approve.
  await editorTab(page, "Overview");
  await expect(page.getByTestId("requirements-ok")).toBeVisible();
  await page.getByLabel("Approval note (optional)").fill("Checked by e2e");
  await page.getByTestId("approve-publish").click();
  await expectToast(page, "Published");
  await page.reload();
  await expect(page.getByText("Published", { exact: true }).first()).toBeVisible();
  const [row] = await db()<any[]>`select status, published_revision is not null as live from tour.tours where id = ${t.id}`;
  expect(row).toEqual({ status: "published", live: true });

  // The customer page now serves it.
  await skipIntro(context);
  await page.goto(`/fa/tours/t/${t.slug}`);
  await expect(page.getByRole("heading", { name: "تور یک‌روزه تخت جمشید" }).first()).toBeVisible();
});

test("AT-16 a rejected submission stays unpublished and the provider gets the note", async ({ context, page }) => {
  const sql = db();
  const owner = await seedUser(sql);
  const p = await seedProvider(sql, owner.id);
  const t = await seedTour(sql, { providerId: p.id, status: "draft" });
  await sql`update tour.tours set status = 'submitted', submitted_at = now() where id = ${t.id}`;
  await signInAdmin(context);
  await page.goto(`/en/admin/tours-platform/tours/${t.id}`);
  await expect(page.getByTestId("reject")).toBeDisabled(); // a note is mandatory
  await page.getByLabel("Rejection note for the provider (required)").fill("Photos show a different site; please replace them.");
  await page.getByTestId("reject").click();
  await expectToast(page, "Rejected");
  await page.reload();
  await expect(page.getByTestId("review-note")).toContainText("Photos show a different site");
  const [row] = await sql<any[]>`select status, review_note, published_revision from tour.tours where id = ${t.id}`;
  expect(row).toEqual({ status: "rejected", review_note: "Photos show a different site; please replace them.", published_revision: null });
  const [audit] = await sql<any[]>`select detail from tour.audit_log where entity_id = ${t.id} and action = 'rejected'`;
  expect(audit.detail.note).toContain("Photos");
  await skipIntro(context);
  // The customer app renders its not-available state (streamed, so the HTTP status is not asserted here).
  await page.goto(`/en/tours/t/${t.slug}`);
  await expect(page.getByRole("heading", { name: "This tour is not available." })).toBeVisible();
  await expect(page.locator("body")).not.toContainText("Persepolis day tour");
});
