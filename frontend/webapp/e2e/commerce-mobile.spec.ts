import { expect, test } from "@playwright/test";

for (const width of [320, 360, 390]) {
  test(`mobile steps, consultation and hero fit at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 740 });
    await page.goto("/?case=layouts");
    const steps = page.getByRole("list", { name: "Booking steps" });
    await expect(steps.locator("li")).toHaveCount(7);
    expect(
      await steps.evaluate((node) => node.scrollWidth <= node.clientWidth)
    ).toBe(true);
    await expect(steps.locator('[aria-current="step"]')).toContainText(
      "تاریخ و ساعت"
    );
    const consultation = page.getByRole("button", {
      name: "مشاوره قبل از خرید",
    });
    expect(
      await consultation
        .locator("span")
        .evaluate(
          (node) =>
            node.getBoundingClientRect().height <=
            parseFloat(getComputedStyle(node).lineHeight) + 1
        )
    ).toBe(true);
    expect(
      await consultation.evaluate(
        (node) => node.scrollWidth <= node.clientWidth
      )
    ).toBe(true);
    const offer = page.getByRole("link", { name: "مشاهده پیشنهادها" });
    expect(
      await offer.evaluate((node) => {
        const card = node
          .closest("section")!
          .firstElementChild!.getBoundingClientRect();
        return card.bottom - node.getBoundingClientRect().bottom;
      })
    ).toBeGreaterThanOrEqual(23);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth
      )
    ).toBe(true);
    await consultation.click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });
}

test("disabled checkout explains missing fields and focuses the selected field", async ({
  page,
}) => {
  await page.goto("/?case=checkout");
  await expect(page.getByRole("button").last()).toBeDisabled();
  const checklist = page.getByRole("status");
  await expect(checklist.getByRole("button")).toHaveCount(5);
  await checklist.getByRole("button").first().click();
  const email = page.getByRole("textbox", { name: "ایمیل", exact: true });
  await expect(email).toBeFocused();
  await email.fill("invalid");
  await email.press("Tab");
  await expect(email).toHaveAttribute("aria-invalid", "true");
  await email.fill("test@example.invalid");
  await expect(email).toHaveAttribute("aria-invalid", "false");
  await expect(checklist.getByRole("button")).toHaveCount(4);
});

test("view services scrolls after mounting the tab and also works on repeated clicks", async ({
  page,
}) => {
  await page.goto("/?case=services");
  const button = page.getByRole("button", { name: "مشاهده خدمات" });
  await button.click();
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(1400);
  await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
  await button.click();
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(1400);
});

test("selected details open above navigation, scroll fully, close with Escape and restore focus", async ({
  page,
}) => {
  await page.goto("/");
  const details = page.getByRole("button").first();
  await details.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  const box = await dialog.boundingBox();
  expect(box!.y + box!.height).toBeLessThanOrEqual(740);
  await dialog.evaluate((el) => {
    el.scrollTop = el.scrollHeight;
  });
  expect(await dialog.evaluate((el) => el.scrollTop)).toBeGreaterThan(0);
  const top = await page.evaluate(
    () =>
      document.elementFromPoint(180, 700)?.closest('[role="dialog"]') !== null
  );
  expect(top).toBe(true);
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(details).toBeFocused();
});

test("changing a selection keeps reset confirmation entirely accessible", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "تغییر", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button").last().click();
  await expect(dialog).toHaveCount(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth
    )
  ).toBe(true);
});

test("online payment is selected automatically and other methods are optional", async ({
  page,
}) => {
  await page.route("**/api/booking-pro/payments/methods?*", (route) =>
    route.fulfill({
      json: {
        items: [
          { code: "gateway_card", name: "آنلاین" },
          { code: "wallet", name: "کیف پول" },
        ],
      },
    })
  );
  await page.route("**/api/payment-gateways?*", (route) =>
    route.fulfill({
      json: {
        items: [{ code: "zarinpal", displayName: "زرین‌پال", currency: "IRR" }],
      },
    })
  );
  await page.goto("/?case=payment");
  await expect(
    page.getByRole("button", { name: "پرداخت", exact: true })
  ).toBeEnabled();
  await expect(
    page.getByRole("button", { name: "کیف پول", exact: true })
  ).toHaveCount(0);
  await page.getByRole("button", { expanded: false }).click();
  await expect(
    page.getByRole("button", { name: /کیف پول/ }).last()
  ).toBeVisible();
  expect(await page.locator("body").innerText()).not.toMatch(/IRR|IRT/);
});

test("payment service failure does not enable an unconfigured payment", async ({
  page,
}) => {
  await page.route("**/api/**", (route) =>
    route.fulfill({ status: 503, json: { error: "unavailable" } })
  );
  await page.goto("/?case=payment");
  await expect(page.getByRole("alert")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "پرداخت", exact: true })
  ).toBeDisabled();
});

test("large checkout total fits and a payment failure stays visible for retry", async ({
  page,
}) => {
  await page.goto("/?case=checkout");
  await page
    .getByPlaceholder("ایمیل", { exact: true })
    .fill("test@example.invalid");
  const inputs = page.locator("input");
  await inputs.nth(1).fill("مشتری آزمایشی");
  await inputs.nth(4).fill("IR");
  await inputs.nth(5).fill("تهران");
  await inputs.nth(7).fill("خیابان آزمایشی شماره ۱۲۳");
  const submit = page.getByRole("button").last();
  await expect(submit).toBeEnabled();
  const buttonBox = await submit.boundingBox();
  expect(buttonBox!.x).toBeGreaterThanOrEqual(0);
  expect(buttonBox!.x + buttonBox!.width).toBeLessThanOrEqual(360);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth
    )
  ).toBe(true);
  await submit.click();
  await expect(page.getByText("Payment service unavailable")).toBeVisible();
  await submit.click();
  expect(await page.evaluate(() => (window as any).__attempts.length)).toBe(1);
  expect(
    await page.evaluate(() => (window as any).__paymentAttempts[0].orderId)
  ).toBe("test-order-id");
});

test("a phone-only signed-in customer must provide the email required by order placement", async ({
  page,
}) => {
  await page.goto("/?case=checkout&signedIn=1");
  const inputs = page.locator("input");
  await inputs.nth(1).fill("مشتری آزمایشی");
  await inputs.nth(4).fill("IR");
  await inputs.nth(5).fill("تهران");
  await inputs.nth(7).fill("خیابان آزمایشی شماره ۱۲۳");
  const submit = page.getByRole("button").last();
  await expect(submit).toBeDisabled();
  await page
    .getByRole("textbox", { name: "ایمیل", exact: true })
    .fill("test@example.invalid");
  await expect(submit).toBeEnabled();
});

test("quote failure explains the block and can be retried without losing form values", async ({
  page,
}) => {
  await page.goto("/?case=checkout");
  await page
    .getByRole("textbox", { name: "ایمیل", exact: true })
    .fill("test@example.invalid");
  const inputs = page.locator("input");
  await inputs.nth(1).fill("مشتری آزمایشی");
  await inputs.nth(4).fill("IR");
  await inputs.nth(5).fill("تهران");
  await inputs.nth(7).fill("خیابان آزمایشی شماره ۱۲۳");
  const pay = page.getByRole("button").last();
  await expect(pay).toBeEnabled();
  await page.evaluate(() => {
    (window as any).__quoteFailure = true;
  });
  await inputs.nth(4).focus();
  await inputs.nth(4).press("Tab");
  const retry = page.getByRole("status").getByRole("button");
  await expect(retry).toHaveCount(1);
  await expect(pay).toBeDisabled();
  await page.evaluate(() => {
    (window as any).__quoteFailure = false;
  });
  await retry.click();
  await expect(pay).toBeEnabled();
  await expect(inputs.nth(7)).toHaveValue("خیابان آزمایشی شماره ۱۲۳");
  await expect(page.getByRole("status")).toHaveCount(0);
});
