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
    // An indexable page usually has no robots meta at all; a locator would
    // auto-wait for it until the test times out, so read the DOM directly.
    const robots = await page.evaluate(
      () => document.querySelector('meta[name="robots"]')?.getAttribute("content") ?? ""
    );
    expect(robots).not.toContain("noindex");
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

// --- lsevincare.com SEO/GEO batch: guides, locale signals, llms.txt, schema ---

const jsonLdTypes = async (page: import("@playwright/test").Page) =>
  page.$$eval('script[type="application/ld+json"]', (nodes) =>
    nodes.flatMap((node) => {
      const data = JSON.parse(node.textContent || "{}");
      return (data["@graph"] ?? [data]).map((item: { "@type": string }) => item["@type"]);
    })
  );

for (const locale of ["fa", "ar", "en"]) {
  test(`guide hub ${locale}: indexable, localized and structured`, async ({ page }, testInfo) => {
    const path = `/${locale}/medical-tourism`;
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    expect(response?.headers()["content-language"]).toBe(locale);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", `${origin}${path}`);
    const hreflangs = await page.$$eval('link[rel="alternate"][hreflang]', (links) =>
      links.map((link) => link.getAttribute("hreflang")).sort()
    );
    expect(hreflangs).toEqual(["ar", "en", "fa", "x-default"]);
    expect(await jsonLdTypes(page)).toEqual(expect.arrayContaining(["MedicalWebPage", "BreadcrumbList", "FAQPage"]));
    expect(await page.evaluate(() => document.documentElement.dir)).toBe(locale === "en" ? "ltr" : "rtl");
    expect(await page.evaluate(() => document.documentElement.lang)).toBe(locale);
    await page.screenshot({ path: testInfo.outputPath(`guide-hub-${locale}.png`), fullPage: true });
  });
}

test("guides: related link, back/forward and refresh", async ({ page }) => {
  await page.goto("/en/medical-tourism");
  const related = page.locator('nav[aria-label="Related guides"] a').first();
  const href = await related.getAttribute("href");
  await related.click();
  await expect(page).toHaveURL(new RegExp(`${href}$`));
  await expect(page.locator("h1")).toHaveCount(1);
  await page.reload();
  await expect(page.locator("h1")).toHaveCount(1);
  await page.goBack();
  await expect(page).toHaveURL(/\/en\/medical-tourism$/);
  await page.goForward();
  await expect(page).toHaveURL(new RegExp(`${href}$`));
});

test("visa guide publishes HowTo steps from the visible procedure", async ({ page }) => {
  await page.goto("/en/medical-tourism/visa");
  expect(await jsonLdTypes(page)).toContain("HowTo");
  await expect(page.locator("ol").filter({ hasText: /./ }).first()).toBeVisible();
});

test("guides exist only in written languages", async ({ request }) => {
  expect((await request.get("/tr/medical-tourism")).status()).toBe(404);
  expect((await request.get("/fa/medical-tourism/not-a-guide")).status()).toBe(404);
});

test("locale roots redirect to the localized home instead of a soft refresh", async ({ request }) => {
  const response = await request.get("/en", { maxRedirects: 0 });
  expect([301, 302, 307, 308]).toContain(response.status());
  expect(response.headers()["location"]).toMatch(/\/en\/n\/app\/mobile\/home$/);
});

test("Sorani pages declare ckb", async ({ request }) => {
  const response = await request.get("/ku/n/app/mobile/home");
  expect(response.headers()["content-language"]).toBe("ckb");
});

test("llms.txt maps the site on the public domain", async ({ request }) => {
  const response = await request.get("/llms.txt");
  expect(response.status()).toBe(200);
  const text = await response.text();
  expect(text).toContain(`${origin}/fa/medical-tourism`);
  expect(text).not.toContain("appmain.lsevin.com");
});

test("home: one descriptive h1, organization schema and a crawlable guides entry", async ({ page }) => {
  await page.goto("/fa/n/app/mobile/home");
  await expect(page.locator("h1")).toHaveCount(1);
  const org = await page.$$eval('script[type="application/ld+json"]', (nodes) =>
    nodes
      .map((node) => JSON.parse(node.textContent || "{}"))
      .flatMap((data) => data["@graph"] ?? [data])
      .find((item) => item["@type"] === "Organization")
  );
  expect(org.alternateName).toContain("السوین");
  // A first visit opens the location picker sheet over the page; close it the
  // way a visitor would (tap the dimmed backdrop) before using the page.
  // It opens shortly after hydration, so wait for it rather than checking once.
  const pickerBackdrop = page.locator(".sheet-scrim").first();
  const opened = await pickerBackdrop
    .waitFor({ state: "visible", timeout: 5_000 })
    .then(() => true)
    .catch(() => false);
  if (opened) {
    await pickerBackdrop.click({ position: { x: 10, y: 10 } });
    await expect(pickerBackdrop).toBeHidden();
  }
  const guideLink = page.locator('a[href$="/fa/medical-tourism"]').first();
  await expect(guideLink).toBeVisible();
  await guideLink.click();
  await expect(page).toHaveURL(/\/fa\/medical-tourism$/);
});

test("legacy provider and type URLs move permanently to the current pages", async ({ request }) => {
  const id = process.env.SEO_E2E_PROVIDER_ID || "30000000-0000-4000-8000-000000000001";
  const provider = await request.get(`/fa/service-providers/${id}`, { maxRedirects: 0 });
  expect([301, 308]).toContain(provider.status());
  expect(provider.headers()["location"]).toMatch(new RegExp(`/fa/n/app/mobile/provider/${id}$`));
  const type = await request.get("/en/type/20000000-0000-4000-8000-000000000001", { maxRedirects: 0 });
  expect([301, 308]).toContain(type.status());
  expect(type.headers()["location"]).toMatch(/\/en\/n\/app\/mobile\/categories$/);
});
