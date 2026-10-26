/**
 * AT-38 Reviewer permissions (M-030): an admin assigns a translator to one
 * locale; that person can edit/approve only that locale (through the portal
 * RPC boundary they actually use) and cannot reach the admin panel, prices,
 * visibility or other locales. Revoking takes effect immediately.
 *   TOURS_E2E_BASE_URL=http://localhost:3031 npx playwright test --config playwright.tours.config.ts admin-translator.spec.ts --project desktop
 */
import { expect, test, type APIRequestContext } from "@playwright/test";

import { seedProvider, seedTour, seedUser } from "../../src/features/tours/testing/fixtures";

import { expectToast, signInAdmin } from "./admin-helpers";
import { closeDb, db } from "./support/db";
import { E2E_INTERNAL_KEY } from "./support/env";
import { signIn } from "./support/session";

test.afterAll(closeDb);
// Long cross-page workflows; the first compile of each route on the dev server is slow.
test.describe.configure({ timeout: 300_000 });

async function rpc(request: APIRequestContext, method: string, actingUserId: string, args: unknown) {
  const res = await request.post(`/api/internal/tours/v1/rpc/${method}`, {
    headers: { Authorization: `Bearer ${E2E_INTERNAL_KEY}`, "Content-Type": "application/json", "X-Acting-User-Id": actingUserId },
    data: { args },
  });
  return { status: res.status(), body: await res.json() };
}

test("AT-38 translator assigned to ar-SA approves only ar-SA, is denied everything else, and loses access when revoked", async ({ browser, context, page, request }) => {
  const sql = db();
  const owner = await seedUser(sql);
  const p = await seedProvider(sql, owner.id);
  const t = await seedTour(sql, { providerId: p.id, translateTo: ["en-US"] });
  const translator = await seedUser(sql, { firstName: "Leila" });

  await signInAdmin(context);
  await page.goto("/en/admin/tours-platform/translations");
  await page.getByLabel("Find user (email, phone or name)").fill(translator.email);
  await page.getByLabel("Find user (email, phone or name)").press("Enter");
  await page.getByRole("radio").first().check();
  await page.locator("#tr-locale").selectOption("ar-SA");
  await page.getByTestId("grant-translator").click();
  await expectToast(page, "Assigned");
  await page.reload();
  await expect(page.locator(`tr[data-user="${translator.id}"][data-locale="ar-SA"]`)).toBeVisible();

  // The translator cannot open the admin panel.
  const tctx = await browser.newContext();
  await signIn(tctx, { ...translator, roles: ["user"] });
  const tpage = await tctx.newPage();
  await tpage.goto("/en/admin/tours-platform/translations", { waitUntil: "commit" });
  await expect(tpage).not.toHaveURL(/\/admin\//);
  await tctx.close();

  // Their own locale: write + approve.
  expect((await rpc(request, "content.save", translator.id, { tourId: t.id, locale: "ar-SA", fields: { title: "جولة برسبوليس" } })).status).toBe(200);
  expect((await rpc(request, "content.approve", translator.id, { tourId: t.id, locale: "ar-SA" })).status).toBe(200);
  const [ar] = await sql<any[]>`select status from tour.content where entity_id = ${t.id} and field_key = 'title' and locale = 'ar-SA'`;
  expect(ar.status).toBe("published");
  // Everything else is refused.
  for (const [method, args] of [
    ["content.save", { tourId: t.id, locale: "en-US", fields: { title: "hijack" } }],
    ["content.approve", { tourId: t.id, locale: "en-US" }],
    ["options.save", { tourId: t.id, locale: "ar-SA", options: [{ code: "standard", kind: "public", tiers: [{ travelerClass: "adult", amount: 1 }] }] }],
    ["tour.setVisibility", { tourId: t.id, target: "paused" }],
    ["tour.updateCore", { tourId: t.id, patch: { maxParticipants: 99 } }],
  ] as const) {
    const r = await rpc(request, method, translator.id, args);
    expect(r.status, method).toBe(403);
  }
  const [price] = await sql<any[]>`select amount from tour.price_tiers where option_id = ${t.optionId} and traveler_class = 'adult'`;
  expect(Number(price.amount)).toBe(12_000_000);

  // Revoke in admin → immediate loss of access.
  await page.locator(`tr[data-user="${translator.id}"][data-locale="ar-SA"]`).getByRole("button", { name: "Revoke" }).click();
  await expectToast(page, "Revoked");
  expect((await rpc(request, "content.save", translator.id, { tourId: t.id, locale: "ar-SA", fields: { title: "x" } })).status).toBe(403);
});
