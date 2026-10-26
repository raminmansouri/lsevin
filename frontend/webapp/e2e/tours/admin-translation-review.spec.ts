/**
 * AT-37 Translation approval (M-031): changing the source-language
 * cancellation rule marks the approved translation "Needs review"; the draft is
 * not public and customers keep seeing the approved text until a reviewer
 * approves a new translation.
 *   TOURS_E2E_BASE_URL=http://localhost:3031 npx playwright test --config playwright.tours.config.ts admin-translation-review.spec.ts --project desktop
 */
import { expect, test } from "@playwright/test";

import { seedProvider, seedTour, seedUser } from "../../src/features/tours/testing/fixtures";

import { expectToast, signInAdmin, skipIntro } from "./admin-helpers";
import { closeDb, db } from "./support/db";

test.afterAll(closeDb);
// Long cross-page workflows; the first compile of each route on the dev server is slow.
test.describe.configure({ timeout: 300_000 });

const OLD_EN = "Full refund up to 72 hours before departure, 50% up to 24 hours before.";

test("AT-37 source cancellation change flags the English translation for review; customers keep the approved text", async ({ context, page, browser }) => {
  const sql = db();
  const owner = await seedUser(sql);
  const p = await seedProvider(sql, owner.id);
  const t = await seedTour(sql, { providerId: p.id, translateTo: ["en-US"] });
  await signInAdmin(context);

  await page.goto(`/en/admin/tours-platform/tours/${t.id}?tab=policy`);
  await page.locator("#pol-c-fa-IR").fill("فقط تا ۴۸ ساعت قبل از حرکت بازپرداخت کامل؛ پس از آن بازپرداختی نیست.");
  await page.getByTestId("create-policy").click();
  await expectToast(page, "Policy version created");

  // The translation is now flagged; its live value is untouched.
  await page.goto(`/en/admin/tours-platform/tours/${t.id}?tab=content&locale=en-US`);
  const field = page.locator('[data-field="cancellation_policy"]');
  await expect(field).toHaveAttribute("data-status", "outdated");
  await expect(page.getByTestId("outdated-cancellation_policy")).toBeVisible();
  await expect(page.locator('[data-locale="en-US"]').first()).toBeVisible();
  const [row] = await sql<any[]>`
    select status, published_value from tour.content
     where entity_type = 'tour' and entity_id = ${t.id} and field_key = 'cancellation_policy' and locale = 'en-US'`;
  expect(row).toEqual({ status: "outdated", published_value: OLD_EN });
  // The overview shows the warning (it does not block a live tour).
  await page.goto(`/en/admin/tours-platform/tours/${t.id}`);
  await expect(page.getByTestId("requirements").locator('[data-code="outdated_translations"][data-severity="warning"]')).toBeVisible();

  // Customer (English) still sees the approved English text, never the Persian draft.
  const customer = await browser.newContext();
  await skipIntro(customer);
  const cpage = await customer.newPage();
  await cpage.goto(`/en/tours/t/${t.slug}`);
  await expect(cpage.locator("body")).toContainText(OLD_EN);
  await expect(cpage.locator("body")).not.toContainText("پس از آن بازپرداختی نیست");

  // A reviewer updates and approves the translation → live again, flag cleared.
  await page.goto(`/en/admin/tours-platform/tours/${t.id}?tab=content&locale=en-US`);
  await page.locator("#content-cancellation_policy").fill("Full refund up to 48 hours before departure; no refund after that.");
  await page.getByTestId("save-content").click();
  // Wait for the saved draft to come back from the server before approving it.
  await expect(page.locator('[data-field="cancellation_policy"]')).toHaveAttribute("data-status", "draft");
  await page.getByTestId("approve-cancellation_policy").click();
  await expectToast(page, "Approved");
  await page.reload();
  await expect(page.locator('[data-field="cancellation_policy"]')).toHaveAttribute("data-status", "published");
  await customer.close();
});
