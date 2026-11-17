import { expect, test } from "@playwright/test";

/**
 * Admin booking create → edit → add-ons workflow.
 * Needs a signed-in admin storage state (same convention as admin-bug-reporter.spec.ts):
 *   ADMIN_E2E_STATE=path/to/admin-state.json npx playwright test admin-bookings.spec.ts
 * It creates a real booking on the target environment; run it against local or staging only.
 */
const adminState = process.env.ADMIN_E2E_STATE;

async function pickFirstOption(page: import("@playwright/test").Page, trigger: import("@playwright/test").Locator, search?: string) {
  await trigger.click();
  if (search) await page.getByRole("dialog").getByRole("combobox").fill(search);
  const option = page.getByRole("option").filter({ hasNotText: "Load more" }).first();
  await expect(option).toBeVisible({ timeout: 15_000 });
  await option.click();
}

test.describe("admin bookings", () => {
  test.skip(!adminState, "ADMIN_E2E_STATE is required for authenticated admin verification.");
  test.use({ storageState: adminState });

  test("list page links to the new-booking form; old /add redirects there", async ({ page }) => {
    await page.goto("/fa/admin/bookings");
    const add = page.getByTestId("admin-add-booking");
    await expect(add).toHaveText(/افزودن رزرو/);
    await add.click();
    await expect(page).toHaveURL(/\/fa\/admin\/bookings\/new$/);

    await page.goto("/fa/admin/bookings/add");
    await expect(page).toHaveURL(/\/fa\/admin\/bookings\/new$/);
  });

  test("creates a booking with an override price, persists edits after reload, attaches and removes a hotel stay", async ({ page }) => {
    await page.goto("/en/admin/bookings/new");
    const combos = page.locator("form").getByRole("combobox");

    // Validation first: submitting empty must not navigate.
    await page.getByRole("button", { name: "Save booking" }).click();
    await expect(page).toHaveURL(/\/admin\/bookings\/new$/);

    await pickFirstOption(page, combos.nth(0)); // customer
    await pickFirstOption(page, combos.nth(1)); // provider
    await pickFirstOption(page, combos.nth(2)); // service (filtered by provider)
    await page.locator('input[type="date"]').first().fill("2031-03-10");
    await page.locator('input[name="totalAmount"]').fill("4321.5");
    await page.getByRole("button", { name: "Save booking" }).click();

    await expect(page).toHaveURL(/\/admin\/bookings\/[0-9a-f-]{36}\/update$/, { timeout: 20_000 });
    await expect(page.locator('input[name="totalAmount"]')).toHaveValue("4321.5");

    // Edit status via the dropdown, reload, confirm it stuck.
    await page.getByRole("combobox").filter({ hasText: "Confirmed" }).first().click();
    await page.getByRole("option", { name: "Completed" }).click();
    await page.getByRole("button", { name: "Save booking" }).click();
    await expect(page.getByText("Booking saved")).toBeVisible();
    await page.reload();
    await expect(page.getByRole("combobox").filter({ hasText: "Completed" }).first()).toBeVisible();

    // Hotel stay add-on.
    await page.getByRole("button", { name: "Add hotel stay" }).click();
    const hotelForm = page.getByTestId("booking-admin-hotel-form");
    await pickFirstOption(page, hotelForm.getByRole("combobox").first());
    await hotelForm.locator('input[type="date"]').nth(0).fill("2031-03-10");
    await hotelForm.locator('input[type="date"]').nth(1).fill("2031-03-12");
    await hotelForm.getByRole("button", { name: "Attach to booking" }).click();
    await expect(page.getByTestId("booking-admin-addon-row")).toHaveCount(1);
    await page.reload();
    await expect(page.getByTestId("booking-admin-addon-row")).toHaveCount(1);

    page.once("dialog", (dialog) => dialog.accept());
    await page.getByTestId("booking-admin-addon-row").getByRole("button", { name: "Remove" }).click();
    await expect(page.getByTestId("booking-admin-addon-row")).toHaveCount(0);
  });
});
