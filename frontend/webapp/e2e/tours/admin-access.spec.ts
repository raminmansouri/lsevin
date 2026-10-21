/**
 * Who may open the Tours administration panel.
 *   TOURS_E2E_BASE_URL=http://localhost:3031 npx playwright test --config playwright.tours.config.ts admin-access.spec.ts --project desktop
 */
import { expect, test } from "@playwright/test";

import { seedUser } from "../../src/features/tours/testing/fixtures";

import { signInAdmin } from "./admin-helpers";
import { closeDb, db } from "./support/db";
import { signIn } from "./support/session";

test.afterAll(closeDb);

test("a guest is sent to sign-in and a signed-in non-admin is redirected away from every tours-platform page", async ({ context, page }) => {
  await page.goto("/en/admin/tours-platform", { waitUntil: "commit" });
  await expect(page).toHaveURL(/\/en\/sign-in\?redirectTo=/);

  const u = await seedUser(db());
  await signIn(context, { ...u, roles: ["user"] });
  for (const path of ["/en/admin/tours-platform", "/en/admin/tours-platform/settings", "/en/admin/tours-platform/bookings", "/fa/admin/tours-platform/tours?queue=1"]) {
    // The redirect target is the (heavy) home page; only where we land matters here.
    await page.goto(path, { waitUntil: "commit" });
    await expect(page, path).not.toHaveURL(/\/admin\//);
  }
  // The CSV export route is gated too and never returns data to a non-admin.
  const res = await page.request.get("/en/admin/tours-platform/reports/export", { maxRedirects: 0 });
  expect([302, 307, 308, 401, 403]).toContain(res.status());
});

test("an admin reaches the dashboard by direct URL, after refresh, and through the section navigation", async ({ context, page }) => {
  await signInAdmin(context);
  await page.goto("/en/admin/tours-platform");
  await expect(page.getByRole("heading", { name: "Tours platform", level: 1 })).toBeVisible();
  await expect(page.getByText("Waiting for review")).toBeVisible();
  await page.reload();
  await expect(page.getByText("Translation coverage (required fields)")).toBeVisible();
  await page.getByRole("navigation", { name: "Tours platform sections" }).getByRole("link", { name: "Settings" }).click();
  await expect(page).toHaveURL(/\/en\/admin\/tours-platform\/settings$/);
  await expect(page.getByTestId("hijri-convention")).toContainText("islamic-umalqura");
  await page.goBack();
  await expect(page).toHaveURL(/\/en\/admin\/tours-platform$/);
  // Persian admin UI renders translated labels (no raw keys).
  await page.goto("/fa/admin/tours-platform");
  await expect(page.getByRole("heading", { name: "پلتفرم تورها", level: 1 })).toBeVisible();
  await expect(page.locator("body")).not.toContainText("TourAdmin.");
});

test("M-021/M-022 reports page renders KPIs and the CSV export is labelled, BOM-prefixed and admin-only", async ({ context, page }) => {
  await signInAdmin(context);
  await page.goto("/en/admin/tours-platform/reports?calendar=persian&tz=Asia%2FTehran");
  await expect(page.getByTestId("kpis")).toBeVisible({ timeout: 180_000 });
  const href = await page.getByTestId("export-csv").getAttribute("href");
  expect(href).toContain("calendar=persian");
  const res = await page.request.get(href!);
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toContain("text/csv");
  const body = await res.text();
  expect(body.charCodeAt(0)).toBe(0xfeff);
  expect(body.split("\r\n")[0]).toContain("departure_date_persian");
  expect(body.split("\r\n")[0]).toContain("report_timezone");
  // An invalid date in the chosen calendar is a validation error, never a crash.
  const bad = await page.request.get("/en/admin/tours-platform/reports/export?calendar=persian&from=1405-12-31");
  expect(bad.status()).toBe(400);
});
