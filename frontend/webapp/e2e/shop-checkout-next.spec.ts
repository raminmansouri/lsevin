import { expect, test } from "@playwright/test";

test.beforeEach(async ({ request }) => {
  await request.post("/api/state", { data: {} });
});
test("converted cart does not intercept the IPG redirect", async ({
  page,
  request,
}) => {
  await page.goto("/checkout");
  await page.getByRole("button", { name: /^پرداخت$|^ثبت سفارش$/ }).click();
  await expect(page).toHaveURL(/\/gateway$/);
  await expect(
    page.getByRole("heading", { name: "Test IPG destination" })
  ).toBeVisible();
  expect(await (await request.get("/api/state")).json()).toMatchObject({
    orders: 1,
    attempts: 1,
  });
});
test("gateway failure remains on checkout and retry reaches IPG without another order", async ({
  page,
  request,
}) => {
  await request.post("/api/state", { data: { failFirst: true } });
  await page.goto("/checkout");
  await page.getByRole("button", { name: /^پرداخت$|^ثبت سفارش$/ }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: "خطایی رخ داد" })
  ).toBeVisible();
  await expect(page).toHaveURL(/\/checkout$/);
  await expect(
    page.getByRole("textbox", { name: "ایمیل", exact: true })
  ).toBeDisabled();
  await page.getByRole("button", { name: "تلاش دوباره", exact: true }).click();
  await expect(page).toHaveURL(/\/gateway$/);
  expect(await (await request.get("/api/state")).json()).toMatchObject({
    orders: 1,
    attempts: 2,
  });
});
