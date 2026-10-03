import { expect, test } from "@playwright/test";

test("customer market currency can be changed and survives navigation and reload", async ({
  page,
  context,
}) => {
  await context.setExtraHTTPHeaders({
    "x-country": process.env.SHOP_E2E_COUNTRY || "IR",
  });
  await page.goto("/en/n/app/mobile/shop");
  const selector = page.getByRole("combobox", {
    name: "Change display currency",
  });
  await expect(selector).toBeVisible();
  await expect(selector).toHaveValue(
    process.env.SHOP_E2E_MARKET_CURRENCY || "IRR"
  );
  const target = process.env.SHOP_E2E_TARGET_CURRENCY || "EUR";
  await selector.selectOption(target);
  await expect(selector).toHaveValue(target);
  await expect
    .poll(
      async () =>
        (await context.cookies()).find(
          (cookie) => cookie.name === "lsevin_shop_ccy"
        )?.value
    )
    .toBe(target);
  await page.reload();
  await expect(selector).toHaveValue(target);
  await page.getByRole("link", { name: "Cart", exact: true }).click();
  await expect(selector).toHaveValue(target);
});

test.describe("admin publication", () => {
  test.use({ storageState: process.env.SHOP_E2E_ADMIN_STATE || undefined });
  test.skip(
    !process.env.SHOP_E2E_ADMIN_STATE,
    "Requires an admin test session"
  );
  test("a seeded product can be unpublished and republished with storefront cache refresh", async ({
    page,
  }) => {
    const productId = process.env.SHOP_E2E_PRODUCT_ID;
    const slug = process.env.SHOP_E2E_PRODUCT_SLUG;
    test.skip(
      !productId || !slug || !process.env.SHOP_E2E_ADMIN_STATE,
      "Requires a disposable active product and admin storage state"
    );
    // Prime the real product cache before unpublishing.
    await page.goto(`/en/n/app/mobile/shop/product/${slug}`);
    await expect(
      page.getByRole("heading", { name: "Not found", exact: true })
    ).toHaveCount(0);
    await expect(
      page.getByRole("combobox", { name: "Change display currency" })
    ).toBeVisible();
    await page.goto("/en/admin/shop/products");
    const row = page.locator("tr").filter({
      has: page.locator(`a[href$="/admin/shop/products/${productId}"]`),
    });
    await expect(
      row.getByRole("button", { name: "Unpublish", exact: true })
    ).toBeVisible();
    try {
      await row.getByRole("button", { name: "Unpublish", exact: true }).click();
      await expect(
        row.getByRole("button", { name: "Publish", exact: true })
      ).toBeVisible();
      await page.reload();
      await expect(
        row.getByRole("button", { name: "Publish", exact: true })
      ).toBeVisible();
      await page.goto(`/en/n/app/mobile/shop/product/${slug}`);
      await expect(
        page.getByRole("heading", { name: "Not found", exact: true })
      ).toBeVisible();
    } finally {
      await page.goto("/en/admin/shop/products");
      const publish = row.getByRole("button", { name: "Publish", exact: true });
      if (await publish.count()) await publish.click();
      await expect(
        row.getByRole("button", { name: "Unpublish", exact: true })
      ).toBeVisible();
    }
    await page.goto(`/en/n/app/mobile/shop/product/${slug}`);
    await expect(
      page.getByRole("combobox", { name: "Change display currency" })
    ).toBeVisible();
  });
});
