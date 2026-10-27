import { expect, test, type Page } from "@playwright/test";

// Regressions for findings from the Front-End Checklist audit of appmain.lsevin.com
// (2026-10-22). Each test names the checklist rule it guards.

async function headingLevels(page: Page) {
  return page
    .locator("h1, h2, h3, h4, h5, h6")
    .evaluateAll((els) => els.map((el) => Number(el.tagName.slice(1))));
}

test.describe("locale root redirect (redirect-chains)", () => {
  // The locale root used to answer 200 with a 1s meta refresh to the
  // unprefixed /n/app/mobile/home, which the middleware sent to /fa — so an
  // /en visitor landed on the Persian site.
  for (const locale of ["en", "de", "fa"]) {
    test(`/${locale} redirects over HTTP and keeps the locale`, async ({ request }) => {
      const response = await request.get(`/${locale}`, { maxRedirects: 0 });
      expect(response.status()).toBe(307);
      expect(new URL(response.headers().location!, "http://x").pathname).toBe(
        `/${locale}/n/app/mobile/home`
      );
    });
  }

  test("/ redirects to the default locale home", async ({ request }) => {
    const response = await request.get("/", { maxRedirects: 0 });
    expect(response.status()).toBe(307);
    expect(new URL(response.headers().location!, "http://x").pathname).toBe(
      "/fa/n/app/mobile/home"
    );
  });

  test("a visitor opening /en ends on the English home", async ({ page }) => {
    await page.goto("/en");
    await expect(page).toHaveURL(/\/en\/n\/app\/mobile\/home$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
  });
});

test.describe("auth forms (password-field-security, form-validation, landmark-one-main)", () => {
  // Scoped to <main>: while React streams the page, the incoming copy of the
  // form waits in a hidden <div id="S:…"> outside it, so page-wide locators
  // briefly match two forms.
  test("sign-in: current-password, POST form, main landmark", async ({ page }) => {
    await page.goto("/en/sign-in");
    const main = page.getByRole("main");
    const password = main.locator('input[name="password"]');
    await expect(password).toHaveAttribute("autocomplete", "current-password");
    // A submit before hydration must not put the password in the URL.
    const form = main.locator("form").filter({ has: page.locator('input[name="password"]') });
    await expect(form).toHaveAttribute("method", "post");
    await expect(page.getByRole("main")).toHaveCount(1);
    await expect(page.getByRole("switch", { name: /remember/i })).toBeVisible();
  });

  test("sign-up: new-password", async ({ page }) => {
    await page.goto("/en/sign-up");
    await expect(page.getByRole("main").locator('input[name="password"]')).toHaveAttribute(
      "autocomplete",
      "new-password"
    );
    await expect(page.getByRole("main")).toHaveCount(1);
  });

  test("password visibility toggle is keyboard operable", async ({ page }) => {
    await page.goto("/en/sign-in");
    const password = page.getByRole("main").locator('input[name="password"]');
    await password.fill("secret-value");
    await page.getByRole("button", { name: "Show password" }).press("Enter");
    await expect(password).toHaveAttribute("type", "text");
    await expect(password).toHaveAttribute("autocomplete", "current-password");
  });
});

test.describe("mobile home (button-name, empty-heading, h1, new-tab)", () => {
  test("notification control is one named link, not a button inside a link", async ({
    page,
  }) => {
    test.setTimeout(180_000);
    await page.goto("/en/n/app/mobile/home");
    const link = page.getByRole("link", { name: "Notifications" });
    await expect(link).toBeVisible();
    await expect(link.locator("button")).toHaveCount(0);
    await expect(link).toHaveAttribute("href", "/en/n/app/mobile/notifications");
    // Notifications are signed-in only, so a guest is sent on to sign-in.
    await link.focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/en\/(n\/app\/mobile\/notifications|sign-in)/, {
      timeout: 60_000,
    });
  });

  test("has an h1, no empty headings, and a named Enamad seal", async ({ page }) => {
    await page.goto("/en/n/app/mobile/home");
    await expect(page.locator("h1")).toHaveCount(1);
    const empty = await page
      .locator("h1, h2, h3, h4, h5, h6")
      .evaluateAll((els) => els.filter((el) => !el.textContent?.trim()).length);
    expect(empty).toBe(0);

    const seal = page.locator('a[href^="https://trustseal.enamad.ir/"]');
    await expect(seal).toHaveAttribute("rel", "noopener");
    await expect(seal).toHaveAttribute("referrerpolicy", "origin");
    await expect(seal.locator("img")).toHaveAttribute("alt", "Enamad e-trust seal");
  });

  test("the server HTML already contains the h1 (static shell)", async ({ request }) => {
    const html = await (await request.get("/en/n/app/mobile/home")).text();
    expect(html).toMatch(/<h1[^>]*>[^<]+<\/h1>/);
  });
});

test.describe("explore (button-name)", () => {
  test("map and filter buttons are named and work from the keyboard", async ({ page }) => {
    await page.goto("/en/n/app/mobile/explore");
    await expect(page.getByRole("button", { name: "Map Discovery" })).toBeVisible();

    const filters = page.getByRole("button", { name: "Filters", exact: true });
    await filters.focus();
    await page.keyboard.press("Enter");
    const sheetTitle = page.getByRole("heading", { name: "Advanced Filters" });
    await expect(sheetTitle).toBeVisible();
    await page.getByRole("button", { name: "Close", exact: true }).press("Enter");
    await expect(sheetTitle).toBeHidden();
  });
});

test("packages: card titles do not skip a heading level (heading-order)", async ({ page }) => {
  await page.goto("/en/n/app/mobile/packages");
  const levels = await headingLevels(page);
  expect(levels[0]).toBe(1);
  for (let i = 1; i < levels.length; i++) {
    expect(levels[i] - levels[i - 1]).toBeLessThanOrEqual(1);
  }
});
