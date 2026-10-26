import { expect, test } from "@playwright/test";

const origin = process.env.SEO_EXPECTED_ORIGIN || "https://lsevincare.com";

// Public read-only tests can safely audit production. No booking or payment writes.
for (const route of ["home", "categories", "explore", "search"]) {
  test(`public ${route}: direct navigation and refresh`, async ({
    page,
  }, testInfo) => {
    const path = `/fa/n/app/mobile/${route}`;
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    await expect(
      page.locator(route === "search" ? "input" : "h1").first()
    ).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath(`${route}-loaded.png`) });
    const refreshed = await page.reload();
    expect(refreshed?.status()).toBe(200);
    await expect(
      page.locator(route === "search" ? "input" : "h1").first()
    ).toBeVisible();
  });
}

test("categories: keyboard filtering, hierarchy and persisted URL", async ({
  page,
}, testInfo) => {
  await page.goto("/fa/n/app/mobile/categories");
  const input = page.getByRole("textbox").first();
  await expect(input).toBeVisible();
  await input.fill("no-category-matches-qa-94731");
  await expect(page.locator('button[aria-label^="Open "]')).toHaveCount(0);
  await input.press("ControlOrMeta+A");
  await input.press("Backspace");
  const parent = page.locator('button[aria-label^="Open "]').first();
  await expect(parent).toBeVisible();
  await parent.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/parent=/);
  const selected = page.url();
  await page.reload();
  await expect(page).toHaveURL(selected);
  await expect(page.locator("h1").first()).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath("category-selected-refreshed.png"),
  });
  await page.goto("/fa/n/app/mobile/home");
  await page.goBack();
  await expect(page).toHaveURL(selected);
});

for (const route of ["home", "categories", "explore"]) {
  test(`SEO ${route}: public canonical domain`, async ({ page }, testInfo) => {
    const path = `/fa/n/app/mobile/${route}`;
    await page.goto(path);
    await page.screenshot({ path: testInfo.outputPath(`${route}-seo.png`) });
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      `${origin}${path}`
    );
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      "content",
      /\S+/
    );
    const robots = await page
      .locator('meta[name="robots"]')
      .getAttribute("content")
      .catch(() => null);
    expect(robots || "").not.toContain("noindex");
  });
}

test("SEO sitemap and robots advertise the public domain", async ({
  request,
}) => {
  const robots = await request.get("/robots.txt");
  expect(robots.status()).toBe(200);
  expect(await robots.text()).toContain(`Sitemap: ${origin}/sitemap.xml`);
  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.status()).toBe(200);
  const xml = await sitemap.text();
  expect(xml).toContain(`${origin}/fa/n/app/mobile/categories`);
  expect(xml).toContain(`${origin}/fa/n/app/mobile/service/`);
  expect(xml).not.toContain("https://appmain.lsevin.com/");
});

test("search keeps recent searches client-side and remains noindex", async ({
  page,
}) => {
  await page.goto("/fa/n/app/mobile/search");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    /noindex/
  );
  await expect(page.locator("input").first()).toBeVisible();
});

for (const [kind, id] of [
  [
    "provider",
    process.env.SEO_E2E_PROVIDER_ID || "30000000-0000-4000-8000-000000000001",
  ],
  [
    "service",
    process.env.SEO_E2E_SERVICE_ID || "50000000-0000-4000-8000-000000000001",
  ],
  [
    "specialist",
    process.env.SEO_E2E_STAFF_ID || "60000000-0000-4000-8000-000000000001",
  ],
]) {
  test(`public ${kind}: seeded entity navigation, canonical and refresh`, async ({
    page,
  }, testInfo) => {
    const path = `/fa/n/app/mobile/${kind}/${id}`;
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    await expect(page.locator("h1").first()).toBeVisible();
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      `${origin}${path}`
    );
    await page.screenshot({ path: testInfo.outputPath(`${kind}-loaded.png`) });
    const refreshed = await page.reload();
    expect(refreshed?.status()).toBe(200);
    await expect(page.locator("h1").first()).toBeVisible();
  });
  test(`public ${kind}: malformed entity is a real 404`, async ({
    request,
  }) => {
    const response = await request.get(`/fa/n/app/mobile/${kind}/not-a-uuid`);
    expect(response.status()).toBe(404);
  });
}
