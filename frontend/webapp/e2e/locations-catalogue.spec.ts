import { expect, test, type Page } from "@playwright/test";

test.skip(
  !process.env.LOCATIONS_E2E_BASE_URL,
  "Set LOCATIONS_E2E_BASE_URL to an application with the imported catalogue"
);

async function iranCitySearch(page: Page) {
  await page.goto("/fa/n/app/mobile/home?countryCode=IR");
  await page.getByRole("button", { name: /مقصد فعلی/ }).click();
  const dialog = page.getByRole("dialog");
  const dismissPermission = dialog.getByRole("button", {
    name: "انصراف",
    exact: true,
  });
  await expect(
    dismissPermission
      .or(dialog.getByText("انتخاب دستی", { exact: true }))
      .first()
  ).toBeVisible();
  if (await dismissPermission.isVisible()) await dismissPermission.click();
  await dialog
    .getByText("کشور", { exact: true })
    .locator("../..")
    .getByRole("button")
    .first()
    .click();
  await page.getByPlaceholder("جستجوی کشور...").fill("ایران");
  await dialog
    .getByRole("button", { name: /^ایران/ })
    .last()
    .click();
  await dialog
    .getByText("شهر", { exact: true })
    .locator("../..")
    .getByRole("button")
    .first()
    .click();
  return page.getByPlaceholder("جستجوی شهر...");
}

test("new village can be selected and survives refresh", async ({ page }) => {
  const search = await iranCitySearch(page);
  await search.fill("منوريچ");
  const village = page
    .getByRole("dialog")
    .getByRole("button", { name: /^منوريچ/ });
  await expect(village).toBeVisible();
  await village.click();
  await page.getByRole("button", { name: "اعمال موقعیت", exact: true }).click();
  await expect(page).toHaveURL(/cityCode=G1000(?:&|$)/);
  await expect(page.getByRole("button", { name: /مقصد فعلی/ })).toContainText(
    "منوريچ"
  );
  await page.reload();
  await expect(page.getByRole("button", { name: /مقصد فعلی/ })).toContainText(
    "منوريچ"
  );
});

test("legacy city remains searchable and missing search is empty", async ({
  page,
}) => {
  const search = await iranCitySearch(page);
  await search.fill("تهران");
  await expect(
    page
      .getByRole("dialog")
      .getByRole("button", { name: /^تهران/ })
      .first()
  ).toBeVisible();
  await search.fill("no-such-place-7c0b4f9e");
  await expect(
    page.getByRole("dialog").getByRole("button", { name: /^تهران/ })
  ).toHaveCount(0);
  await expect(page.getByRole("dialog")).toContainText(/یافت نشد|موردی|نتیجه/);
});
