import { expect, test } from "@playwright/test";

// The policy used to live only under /n/app/mobile/profile/*, a protected path.
// Exercise the new route without adding any session cookies.
test("privacy policy is reachable by direct URL without a session", async ({ page }) => {
  for (const locale of ["fa", "en"]) {
    const response = await page.goto(`/${locale}/privacy-policy`);
    expect(response?.status()).toBe(200);
    await expect(page).toHaveURL(new RegExp(`/${locale}/privacy-policy$`));
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator("section").first()).toBeVisible();

    await page.reload();
    await expect(page).toHaveURL(new RegExp(`/${locale}/privacy-policy$`));
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  }
});
