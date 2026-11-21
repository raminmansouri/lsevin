import { expect, test } from "@playwright/test";

const origin = process.env.SEO_EXPECTED_ORIGIN || "https://lsevincare.com";
// The page heading: an <h1>, or the desktop layout's role="heading" level 1
// (the <h1> of the mobile layout is hidden at desktop width).
const H1 = 'h1:visible, [role="heading"][aria-level="1"]:visible';

/** Full-page screenshot saved in the test's output dir and attached to the report. */
async function attachShot(
  page: import("@playwright/test").Page,
  testInfo: import("@playwright/test").TestInfo,
  name: string
) {
  const file = testInfo.outputPath(`${name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  await testInfo.attach(name, { path: file, contentType: "image/png" });
}

// Public read-only tests can safely audit production. No booking or payment writes.
for (const route of ["home", "categories", "explore", "search"]) {
  test(`public ${route}: direct navigation and refresh`, async ({
    page,
  }, testInfo) => {
    const path = route === 'home' ? '/fa' : route === 'search' ? `/fa/n/app/mobile/${route}` : `/fa/${route}`;
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    if (route === "home") await expect(page.locator("h1").first()).toContainText(/\S/);
    else await expect(page.locator(route === "search" ? "input" : H1).first()).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath(`${route}-loaded.png`) });
    const refreshed = await page.reload();
    expect(refreshed?.status()).toBe(200);
    if (route === "home") await expect(page.locator("h1").first()).toContainText(/\S/);
    else await expect(page.locator(route === "search" ? "input" : H1).first()).toBeVisible();
  });
}

test("categories: keyboard filtering, hierarchy and persisted URL", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const browserErrors: string[] = [];
  page.on('pageerror', (error) => browserErrors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error' && message.text().includes('Hydration failed')) browserErrors.push(message.text());
  });
  await page.goto("/fa/categories");
  const input = page.getByRole("textbox").first();
  await expect(input).toBeVisible();
  // Text typed before hydration is reset by React; retry until it sticks.
  await expect(async () => {
    await input.fill("no-category-matches-qa-94731");
    await expect(input).toHaveValue("no-category-matches-qa-94731", {
      timeout: 1_000,
    });
    await expect(page.locator('main main a[aria-label^="باز کردن "]')).toHaveCount(
      0,
      { timeout: 1_000 }
    );
  }).toPass({ timeout: 15_000 });
  await input.press("ControlOrMeta+A");
  await input.press("Backspace");
  // A category with subcategories is a link to /fa/categories/<slug> (no ?parent=<uuid>).
  const parent = page.locator('main main a[aria-label^="باز کردن زیردسته"]').first();
  await expect(parent).toBeVisible();
  await parent.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/fa\/categories\/[a-z0-9-]+$/);
  const selected = page.url();
  await page.reload();
  await expect(page).toHaveURL(selected);
  await expect(page.locator("h1").first()).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath("category-selected-refreshed.png"),
  });
  await page.goto("/fa");
  await page.goBack();
  await expect(page).toHaveURL(selected);
  expect(browserErrors).toEqual([]);
});

test('@regression explore: localized review count hydrates without a browser error', async ({ page }) => {
  const hydrationErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error' && message.text().includes('Hydration failed')) hydrationErrors.push(message.text());
  });
  const response = await page.goto('/fa/explore');
  expect(response?.status()).toBe(200);
  await expect(page.locator(H1).first()).toBeVisible();
  await page.reload();
  await expect(page.locator(H1).first()).toBeVisible();
  expect(hydrationErrors).toEqual([]);
});

// Seen as Googlebot sees it: a rendering crawler from a non-Iranian IP must stay
// on the Persian page (the home location picker switches people, not crawlers).
const GOOGLEBOT =
  "Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.6778.204 Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";
for (const route of ["home", "categories", "explore"]) {
  test.describe(() => { test.use({ userAgent: GOOGLEBOT, locale: "en-US" });
  test(`SEO ${route}: public canonical domain`, async ({ page }, testInfo) => {
    const path = route === 'home' ? `/fa` : `/fa/${route}`;
    await page.goto(path);
    // Give the client location detection time to (wrongly) move the page.
    await page.waitForLoadState("networkidle").catch(() => undefined);
    expect(new URL(page.url()).pathname).toBe(path);
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
      () =>
        document
          .querySelector('meta[name="robots"]')
          ?.getAttribute("content") ?? ""
    );
    expect(robots).not.toContain("noindex");
  });
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
  expect(xml).toContain(`${origin}/fa/categories`);
  expect(xml).toContain(`${origin}/fa/services/`);
  expect(xml).not.toContain("https://appmain.lsevin.com/");
  expect(xml).toContain(`${origin}/en/categories`);
  expect(xml).not.toContain(`${origin}/es/categories`);
  expect(xml).not.toContain(`${origin}/en/shop</loc>`);
  for (const route of ["offers", "featured", "packages"]) {
    expect(xml).toContain(`${origin}/fa/${route}</loc>`);
    expect(xml).not.toContain(`${origin}/en/${route}</loc>`);
  }
  expect(await robots.text()).not.toContain("Disallow: /*/n/app/mobile/support");
  expect(await robots.text()).not.toContain("Disallow: /*/n/app/mobile/search");
});

test("public campaign pages have canonicals and private support is noindex", async ({ page }) => {
  for (const route of ["offers", "featured", "packages"]) {
    const path = `/fa/${route}`;
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", `${origin}${path}`);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /\S+/);
  }
  await page.goto("/fa/n/app/mobile/support");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex.*follow/);
});

test('@critical app-only URLs expose noindex,follow while public aliases stay indexable', async ({ page }) => {
  for (const path of ['/fa/n/app/mobile/support', '/fa/n/app/mobile/search']) {
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex.*follow/);
  }
  for (const path of ['/fa', '/fa/explore', '/fa/shop']) {
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    const robots = await page.locator('meta[name="robots"]').getAttribute('content');
    expect(robots).not.toMatch(/noindex/);
  }
});

test('@critical seller storefront has a public title, canonical URL and direct legacy redirect', async ({ page, request }, testInfo) => {
  const xml = await (await request.get('/sitemap.xml')).text();
  const path = xml.match(/<loc>[^<]+(\/fa\/shop\/seller\/[a-z0-9-]+)<\/loc>/)?.[1];
  expect(path, 'an active seller with approved products in the sitemap').toBeTruthy();
  const response = await page.goto(path!);
  expect(response?.status()).toBe(200);
  await expect(page.locator(H1).first()).toBeVisible();
  await expect(page.locator('title')).toContainText(/.+\|.+/);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `${origin}${path}`);
  expect((await page.locator('meta[name="robots"]').getAttribute('content')) || '').not.toContain('noindex');
  await attachShot(page, testInfo, 'seller-public-storefront');
  const legacy = path!.replace('/shop/seller/', '/n/app/mobile/shop/seller/');
  const redirect = await request.get(legacy, { maxRedirects: 0 });
  expect([301, 308]).toContain(redirect.status());
  expect(new URL(redirect.headers().location, origin).pathname).toBe(path);
  await page.reload();
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `${origin}${path}`);
});

test('@critical private header and footer destinations are buttons', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/fa/shop');
  const desktop = page.getByTestId('desktop-primary-nav');
  await expect(desktop.locator('a[href*="/bookings"], a[href*="/profile"]')).toHaveCount(0);
  await expect(desktop.getByRole('button', { name: /رزرو|bookings/i })).toBeVisible();
  await expect(desktop.getByRole('button', { name: /پروفایل|profile/i })).toBeVisible();
  const shop = page.getByTestId('shop-header');
  await expect(shop.locator('a[href*="/cart"], a[href*="/wishlist"]')).toHaveCount(0);
  await expect(shop.getByRole('button', { name: /سبد|cart/i })).toBeVisible();
  await expect(shop.getByRole('button', { name: /علاقه|wishlist/i })).toBeVisible();
  const footer = page.getByTestId('desktop-footer');
  await expect(footer.locator('a[href="/fa/n/app/mobile/support"]')).toHaveCount(0);
  await desktop.getByRole('button', { name: /پروفایل|profile/i }).click();
  await expect(page).toHaveURL(/\/(?:login|auth|n\/app\/mobile\/profile)(?:[/?]|$)/);
  await page.goto('/fa/shop');
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByTestId('mobile-bottom-nav').locator('a[href*="/bookings"], a[href*="/profile"]')).toHaveCount(0);
});

test("an indexed package detail is canonical and its fallback locale is noindex", async ({ page, request }) => {
  const xml = await (await request.get("/sitemap.xml")).text();
  const packagePath = xml.match(/<loc>[^<]+(\/fa\/packages\/[a-z0-9-]+)<\/loc>/i)?.[1];
  test.skip(!packagePath, "No active package with Persian title is published in this environment");
  const response = await page.goto(packagePath!);
  expect(response?.status()).toBe(200);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", `${origin}${packagePath}`);
  await page.goto(packagePath!.replace("/fa/", "/en/"));
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
});

for (const section of ['providers', 'services', 'specialists', 'specialties', 'packages']) {
  test(`@critical ${section}: sitemap slug opens directly with a stable canonical`, async ({ page, request }, testInfo) => {
    const sitemapResponse = await request.get('/sitemap.xml');
    expect(sitemapResponse.status()).toBe(200);
    const xml = await sitemapResponse.text();
    const path = xml.match(new RegExp(`<loc>[^<]+(/fa/${section}/[a-z0-9-]+)</loc>`))?.[1];
    expect(path, `active ${section} slug in sitemap`).toBeTruthy();

    const response = await page.goto(path!);
    expect(response?.status()).toBe(200);
    if (section !== 'specialties') await expect(page.locator(H1).first()).toBeVisible();
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `${origin}${path}`);
    await page.screenshot({ path: testInfo.outputPath(`${section}-slug-loaded.png`) });

    const refreshed = await page.reload();
    expect(refreshed?.status()).toBe(200);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `${origin}${path}`);
    await page.screenshot({ path: testInfo.outputPath(`${section}-slug-refreshed.png`) });

    const missing = await request.get(`/fa/${section}/missing-seo-record-94731`);
    expect(missing.status()).toBe(404);
  });
}

test("category and shop fallback locales are excluded from search", async ({
  page,
}) => {
  await page.goto("/fa/categories");
  const schema = await page
    .locator('script[type="application/ld+json"]')
    .allTextContents();
  // Nodes are either top-level or inside an @graph.
  const types = schema.flatMap((text) => {
    const data = JSON.parse(text);
    return [data["@type"], ...(data["@graph"] ?? []).map((node: { "@type"?: string }) => node["@type"])];
  });
  expect(types).toContain(
    "CollectionPage"
  );
  // Localized labels are rendered (the mobile tree, hidden at desktop width, carries them).
  await expect(page.getByText("سایر خدمات").first()).toBeAttached();
  await expect(page.getByText(/زیردسته/).first()).toBeAttached();

  for (const path of ["/es/categories", "/en/shop"]) {
    await page.goto(path);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      "content",
      /noindex/
    );
  }
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
    const newPath = new URL(page.url()).pathname;
    expect(newPath).toMatch(new RegExp(`^/fa/${kind}s/[a-z0-9-]+$`));
    await expect(page.locator(H1).first()).toBeVisible();
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      `${origin}${newPath}`
    );
    await page.screenshot({ path: testInfo.outputPath(`${kind}-loaded.png`) });
    const refreshed = await page.reload();
    expect(refreshed?.status()).toBe(200);
    await expect(page.locator(H1).first()).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath(`${kind}-refreshed.png`) });
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
      return (data["@graph"] ?? [data]).map(
        (item: { "@type": string }) => item["@type"]
      );
    })
  );

for (const locale of ["fa", "ar", "en"]) {
  test(`guide hub ${locale}: indexable, localized and structured`, async ({
    page,
  }, testInfo) => {
    const path = `/${locale}/medical-tourism`;
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    expect(response?.headers()["content-language"]).toBe(locale);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      `${origin}${path}`
    );
    const hreflangs = await page.$$eval(
      'link[rel="alternate"][hreflang]',
      (links) => links.map((link) => link.getAttribute("hreflang")).sort()
    );
    expect(hreflangs).toEqual(["ar", "en", "fa", "x-default"]);
    expect(await jsonLdTypes(page)).toEqual(
      expect.arrayContaining(["MedicalWebPage", "BreadcrumbList", "FAQPage"])
    );
    expect(await page.evaluate(() => document.documentElement.dir)).toBe(
      locale === "en" ? "ltr" : "rtl"
    );
    expect(await page.evaluate(() => document.documentElement.lang)).toBe(
      locale
    );
    await page.screenshot({
      path: testInfo.outputPath(`guide-hub-${locale}.png`),
      fullPage: true,
    });
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

test("visa guide publishes HowTo steps from the visible procedure", async ({
  page,
}) => {
  await page.goto("/en/medical-tourism/visa");
  expect(await jsonLdTypes(page)).toContain("HowTo");
  await expect(
    page.locator("ol").filter({ hasText: /./ }).first()
  ).toBeVisible();
});

test("guides exist only in written languages", async ({ request }) => {
  expect((await request.get("/tr/medical-tourism")).status()).toBe(404);
  expect((await request.get("/fa/medical-tourism/not-a-guide")).status()).toBe(
    404
  );
});

test("home lives at the locale root; the old address moves there once", async ({
  request,
}) => {
  const root = await request.get("/en", { maxRedirects: 0 });
  expect(root.status()).toBe(200);
  const old = await request.get("/en/n/app/mobile/home?countryCode=GB", { maxRedirects: 0 });
  expect([301, 308]).toContain(old.status());
  expect(old.headers()["location"]).toMatch(/^(https?:\/\/[^/]+)?\/en\?countryCode=GB$/);
  const bare = await request.get("/n/app/mobile/home", { maxRedirects: 0 });
  expect([301, 308]).toContain(bare.status());
  expect(new URL(bare.headers()["location"], "http://x").pathname).toBe("/fa");
});

test("Sorani pages declare ckb", async ({ request }) => {
  const response = await request.get("/ku");
  expect(response.headers()["content-language"]).toBe("ckb");
});

// REG-2026-11-09: the root layout rendered <html lang="fa" dir="rtl"> for every
// locale and only a client script fixed it, so the HTML crawlers read declared
// English and Arabic pages as Persian. Read the raw response, not the DOM.
test("server HTML declares each page's own language and direction", async ({ request }) => {
  const cases: Array<[string, string, string]> = [
    ["/fa", "fa", "rtl"],
    ["/en", "en", "ltr"],
    ["/ar", "ar", "rtl"],
    ["/tr/explore", "tr", "ltr"],
    ["/ku", "ckb", "rtl"],
    ["/en/medical-tourism", "en", "ltr"],
    ["/en/providers", "en", "ltr"],
  ];
  for (const [path, lang, dir] of cases) {
    const response = await request.get(path, { maxRedirects: 0 });
    expect(response.status(), path).toBe(200);
    const html = (await response.text()).match(/<html[^>]*>/)?.[0] ?? "";
    expect(html, path).toContain(`lang="${lang}"`);
    expect(html, path).toContain(`dir="${dir}"`);
  }
});

// T40: since the home block was removed, the footer is the only site-wide link
// to the guides. Only where the guides exist, so no locale links to a 404.
test("the footer links the guides hub in the guide languages only", async ({ request }) => {
  for (const [path, locale] of [["/fa", "fa"], ["/en/providers", "en"], ["/ar/explore", "ar"]]) {
    const html = await (await request.get(path)).text();
    expect(html, path).toContain(`href="/${locale}/medical-tourism"`);
    const hub = await request.get(`/${locale}/medical-tourism`, { maxRedirects: 0 });
    expect(hub.status(), locale).toBe(200);
  }
  const tr = await (await request.get("/tr")).text();
  expect(tr).not.toContain('href="/tr/medical-tourism"');
});

test("llms.txt maps the site on the public domain", async ({ request }) => {
  const response = await request.get("/llms.txt");
  expect(response.status()).toBe(200);
  const text = await response.text();
  expect(text).toContain(`${origin}/fa/medical-tourism`);
  expect(text).not.toContain("appmain.lsevin.com");
});

test("home: one descriptive h1 and organization schema @smoke", async ({ page }, testInfo) => {
  await page.goto("/fa");
  await expect(page.locator("h1")).toHaveCount(1);
  const org = await page.$$eval('script[type="application/ld+json"]', (nodes) =>
    nodes
      .map((node) => JSON.parse(node.textContent || "{}"))
      .flatMap((data) => data["@graph"] ?? [data])
      .find((item) => item["@type"] === "Organization")
  );
  expect(org.alternateName).toContain("السوین");
  await attachShot(page, testInfo, "seo__home__loaded");
});

test("guides: the hub links every published guide and each loads @smoke", async ({ page }, testInfo) => {
  await page.goto("/en/medical-tourism");
  await attachShot(page, testInfo, "seo__guide-hub__loaded");
  const hrefs = await page.$$eval('nav[aria-label="Related guides"] a', (links) =>
    links.map((link) => link.getAttribute("href"))
  );
  expect(hrefs.length).toBeGreaterThanOrEqual(14);
  for (const href of hrefs.slice(0, 3)) {
    const response = await page.goto(href!);
    expect(response?.status()).toBe(200);
    await expect(page.locator("h1")).toHaveCount(1);
  }
  await page.reload();
  await expect(page.locator("h1")).toHaveCount(1);
  await attachShot(page, testInfo, "seo__guide__after-reload");
});

test("legacy provider and type URLs move permanently to the current pages", async ({
  request,
}) => {
  const id =
    process.env.SEO_E2E_PROVIDER_ID || "30000000-0000-4000-8000-000000000001";
  const provider = await request.get(`/fa/service-providers/${id}`, {
    maxRedirects: 0,
  });
  expect([301, 308]).toContain(provider.status());
  expect(provider.headers()["location"]).toMatch(
    /\/fa\/providers\/[a-z0-9-]+$/
  );
  const type = await request.get(
    `/en/type/${process.env.SEO_E2E_TYPE_ID || "20000000-0000-4000-8000-000000000001"}`,
    { maxRedirects: 0 }
  );
  expect([301, 308]).toContain(type.status());
  expect(type.headers()["location"]).toMatch(
    /\/en\/specialties\/[a-z0-9-]+$/
  );
});

// docs/seo/lsevin-url-tasks.md T9/T11: every old public address reaches its new
// one in a single permanent redirect, the new address answers 200 itself, and
// private screens keep their paths.
test("old public URLs move in one permanent redirect; private ones stay", async ({
  request,
}) => {
  const moves: [string, RegExp][] = [
    ["/fa/n/app/mobile/explore", /^\/fa\/explore$/],
    ["/n/app/mobile/explore", /^\/fa\/explore$/],
    ["/fa/n/app/mobile/categories", /^\/fa\/categories$/],
    ["/fa/n/app/mobile/map-discovery", /^\/fa\/map$/],
    ["/fa/n/app/mobile/shop", /^\/fa\/shop$/],
    ["/fa/n/app/mobile/packages", /^\/fa\/packages$/],
    ["/fa/n/app/mobile/providers", /^\/fa\/providers$/],
    ["/en/n/app/mobile/offers", /^\/en\/offers$/],
    ["/fa/n/app/mobile/featured", /^\/fa\/featured$/],
    ["/fa/n/app/mobile/home", /^\/fa$/],
    ["/fa/n/app/mobile/medical/clinics", /^\/fa\/clinics$/],
  ];
  for (const [from, to] of moves) {
    const response = await request.get(from, { maxRedirects: 0 });
    expect([301, 308], from).toContain(response.status());
    const target = new URL(response.headers()["location"], "http://x");
    expect(target.pathname, from).toMatch(to);
    const landed = await request.get(target.pathname, { maxRedirects: 0 });
    expect(landed.status(), target.pathname).toBe(200);
  }

  for (const [kind, id] of [
    ["provider", process.env.SEO_E2E_PROVIDER_ID || "30000000-0000-4000-8000-000000000001"],
    ["service", process.env.SEO_E2E_SERVICE_ID || "50000000-0000-4000-8000-000000000001"],
    ["specialist", process.env.SEO_E2E_STAFF_ID || "60000000-0000-4000-8000-000000000001"],
  ]) {
    // With and without a locale: one redirect either way.
    for (const from of [`/fa/n/app/mobile/${kind}/${id}`, `/fa/${kind}s/${id}`, `/n/app/mobile/${kind}/${id}`, `/${kind}s/${id}`]) {
      const response = await request.get(from, { maxRedirects: 0 });
      expect([301, 308], from).toContain(response.status());
      const target = new URL(response.headers()["location"], "http://x").pathname;
      expect(target, from).toMatch(new RegExp(`^/fa/${kind}s/[a-z0-9-]+$`));
      expect(target, from).not.toContain(id);
      const landed = await request.get(target, { maxRedirects: 0 });
      expect(landed.status(), target).toBe(200);
    }
  }

  for (const path of ["/fa/n/app/mobile/shop/cart", "/fa/n/app/mobile/profile"]) {
    const response = await request.get(path, { maxRedirects: 0 });
    const location = response.headers()["location"];
    const target = location ? new URL(location, "http://x").pathname : path;
    expect(target, path).not.toMatch(/^\/fa\/(shop|explore|providers)(\/|$)/);
  }
});

// A slug that changed (migration 0094: English name added to a Persian-only
// record) keeps working: one permanent redirect to the current slug.
test("a previous slug redirects once to the current one", async ({ request }) => {
  const previous = process.env.SEO_E2E_PREVIOUS_PROVIDER_SLUG;
  test.skip(!previous, "SEO_E2E_PREVIOUS_PROVIDER_SLUG names a provider slug kept in category.public_slug_history");
  const response = await request.get(`/fa/providers/${previous}`, { maxRedirects: 0 });
  expect([301, 308]).toContain(response.status());
  const target = new URL(response.headers()["location"], "http://x").pathname;
  expect(target).toMatch(/^\/fa\/providers\/[a-z0-9-]+$/);
  expect(target).not.toBe(`/fa/providers/${previous}`);
  expect((await request.get(target, { maxRedirects: 0 })).status()).toBe(200);
});

// --- Google "Managing multi-regional and multilingual sites" (2026-11-15) ---

const hreflangs = (html: string) =>
  [...(html.split("</head>")[0] ?? "").matchAll(/<link[^>]*rel="alternate"[^>]*>/g)]
    .map((m) => m[0])
    .filter((tag) => /hreflang=/i.test(tag))
    .map((tag) => [tag.match(/hrefLang="([^"]+)"/i)?.[1] ?? "", (tag.match(/href="([^"]+)"/)?.[1] ?? "").replace(/&amp;/g, "&")] as const);
const canonicalOf = (html: string) => html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];

test("hreflang uses codes Google reads; Sorani is ku-Arab, not ckb", async ({ request }) => {
  const html = await (await request.get("/fa/providers")).text();
  const codes = hreflangs(html).map(([code]) => code);
  expect(codes).toContain("ku-Arab");
  expect(codes).not.toContain("ckb");
  for (const code of codes) expect(code).toMatch(/^(x-default|[a-z]{2}(-[A-Z][a-z]{3})?(-[A-Z]{2})?)$/);
});

test("hreflang is reciprocal: each listed version lists the same set back", async ({ request }) => {
  const own = hreflangs(await (await request.get("/fa/providers")).text());
  expect(own.length).toBeGreaterThan(2);
  for (const [code, href] of own.filter(([c]) => c !== "x-default").slice(0, 4)) {
    const path = new URL(href).pathname;
    const html = await (await request.get(path, { maxRedirects: 0 })).text();
    expect(canonicalOf(html), code).toBe(href);
    expect(hreflangs(html), code).toEqual(own);
  }
});

// Googlebot crawls from the US without Accept-Language and the language menu
// only exists after JavaScript: every page needs plain links to its versions.
test("server HTML links each page's other language versions", async ({ request }) => {
  for (const path of ["/fa", "/en/providers", "/fa/explore", "/ar/categories", `/fa/tours/${process.env.SEO_E2E_TOUR_SLUG || "kish-island-beaches-and-sunset"}`]) {
    const html = await (await request.get(path)).text();
    const rest = path.replace(/^\/[a-z]{2}/, "");
    for (const [locale, code] of [["en", "en"], ["fa", "fa"], ["tr", "tr"], ["ku", "ku-Arab"]]) {
      const link = new RegExp(`<a[^>]*href="(${origin.replace(/[.]/g, "\.")})?/${locale}${rest.replace(/[.?]/g, "\$&")}"[^>]*hrefLang="${code}"|<a[^>]*hrefLang="${code}"[^>]*href="(${origin.replace(/[.]/g, "\.")})?/${locale}${rest.replace(/[.?]/g, "\$&")}"`, "i");
      expect(html, `${path} -> ${locale}`).toMatch(link);
    }
  }
});

test("tours: canonical, hreflang only for written languages, other languages noindex, in the sitemap", async ({ request }) => {
  const slug = process.env.SEO_E2E_TOUR_SLUG || "kish-island-beaches-and-sunset";
  const fa = await (await request.get(`/fa/tours/${slug}`)).text();
  expect(canonicalOf(fa)).toBe(`${origin}/fa/tours/${slug}`);
  const codes = hreflangs(fa).map(([code]) => code).sort();
  expect(codes).toEqual(["en", "fa", "x-default"]);
  expect(fa).not.toMatch(/<meta name="robots" content="noindex/);
  const tr = await (await request.get(`/tr/tours/${slug}`)).text();
  expect(tr).toMatch(/<meta name="robots" content="noindex/);
  for (const path of ["/fa/tours/explore", "/fa/tours/intro"]) {
    const html = await (await request.get(path)).text();
    expect(canonicalOf(html), path).toBe(`${origin}${path}`);
    expect(hreflangs(html).length, path).toBeGreaterThan(1);
  }
  const xml = await (await request.get("/sitemap.xml")).text();
  expect(xml).toContain(`${origin}/fa/tours/${slug}`);
  expect(xml).toContain(`${origin}/en/tours/explore`);
  expect(xml).not.toContain(`${origin}/tr/tours/${slug}`);
});

test("listing pages describe what they list (CollectionPage + ItemList)", async ({ request }) => {
  for (const [path, type] of [["/fa/explore", "CollectionPage"], ["/fa/providers", "CollectionPage"], ["/fa/tours/explore", "CollectionPage"], ["/fa", "WebPage"]] as const) {
    const html = await (await request.get(path)).text();
    const nodes = [...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)]
      .flatMap((m) => {
        const data = JSON.parse(m[1]);
        return data["@graph"] ?? [data];
      });
    const page = nodes.find((node) => node["@type"] === type && node.url === `${origin}${path}`);
    expect(page, path).toBeTruthy();
    expect(page.mainEntity?.itemListElement?.length ?? 0, path).toBeGreaterThan(0);
    for (const item of page.mainEntity.itemListElement) expect(item.url, path).toMatch(new RegExp(`^${origin}/`));
    if (path !== "/fa") expect(nodes.some((node) => node["@type"] === "BreadcrumbList"), path).toBe(true);
  }
});

// --- Google Images / video best practices (2026-11-15) ---

// Media lives on the API (/files) and on supplier hosts: a local server started
// without them cannot serve the bytes, so only a deployed site is asked to.
const servesMedia = () => !/127\.0\.0\.1|localhost/.test(String(test.info().project.use.baseURL ?? ""));

test("pages allow large image previews; private and fallback pages keep their own robots", async ({ request }) => {
  for (const path of ["/fa", "/fa/providers", "/fa/explore"]) {
    const head = (await (await request.get(path)).text()).split("</head>")[0];
    expect(head, path).toMatch(/<meta name="robots" content="[^"]*max-image-preview:large/);
    expect(head, path).not.toMatch(/<meta name="robots" content="[^"]*noindex/);
  }
});

test("product photos are crawlable: robots allows the shop image proxy and og:image loads", async ({ request }) => {
  const robots = await (await request.get("/robots.txt")).text();
  expect(robots).toMatch(/^Allow: \/api\/shop\/img$/m);
  expect(robots).toMatch(/^Disallow: \/api\/$/m);
  const xml = await (await request.get("/sitemap.xml")).text();
  const product = xml.match(/<loc>[^<]*\/fa\/products\/([^<]+)<\/loc>/)?.[1];
  expect(product, "a product in the sitemap").toBeTruthy();
  const html = await (await request.get(`/fa/products/${product}`)).text();
  const og = html.match(/<meta property="og:image" content="([^"]+)"/)?.[1]?.replace(/&amp;/g, "&");
  expect(og, "product og:image").toBeTruthy();
  // Supplier photos go through the proxy; our own uploads are under /files.
  expect(new URL(og!).origin).toBe(origin);
  expect(new URL(og!).pathname).toMatch(/^\/(api\/shop\/img$|files\/)/);
  if (servesMedia()) {
    const image = await request.get(new URL(og!).pathname + new URL(og!).search);
    expect(image.status()).toBe(200);
    expect(image.headers()["content-type"]).toMatch(/^image\//);
  }
});

test("the sitemap lists each page's photos as image entries on public URLs", async ({ request }) => {
  const xml = await (await request.get("/sitemap.xml")).text();
  expect(xml).toContain('xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"');
  const entries = [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map((m) => m[1]);
  const provider = entries.find((entry) => /\/fa\/providers\//.test(entry) && /<image:image>/.test(entry));
  expect(provider, "a provider with image entries").toBeTruthy();
  const locs = [...xml.matchAll(/<image:loc>([^<]+)<\/image:loc>/g)].map((m) => m[1]);
  expect(locs.length).toBeGreaterThan(10);
  for (const loc of locs.slice(0, 200)) {
    expect(loc).toMatch(/^https:\/\//);
    expect(loc).not.toMatch(/^https:\/\/[^/]+\/Categories\//); // a bare storage key is a 404
  }
  for (const loc of servesMedia() ? locs.filter((l) => l.startsWith(origin)).slice(0, 5) : []) {
    const url = new URL(loc.replace(/&amp;/g, "&"));
    const image = await request.get(url.pathname + url.search);
    expect(image.status(), loc).toBe(200);
  }
});

// Every public page type carries a structured-data feature Google Search
// supports: at least a valid breadcrumb, plus the entity's own feature
// (audit 2026-11-16). Listing pages have no Google feature of their own.
test("each public page type carries Google-supported structured data", async ({ request }) => {
  const nodesOf = (html: string) => {
    const out: Record<string, any>[] = [];
    const walk = (n: any) => {
      if (!n || typeof n !== "object") return;
      if (Array.isArray(n)) return n.forEach(walk);
      if (n["@type"]) out.push(n);
      Object.values(n).forEach(walk);
    };
    for (const m of html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)) {
      const data = JSON.parse(m[1]);
      walk(data["@graph"] ?? data);
    }
    return out;
  };
  const cases: [string, string[]][] = [
    ["/fa", ["Organization"]],
    ["/fa/explore", ["BreadcrumbList"]],
    ["/fa/map", ["BreadcrumbList"]],
    ["/fa/providers", ["BreadcrumbList"]],
    ["/fa/categories", ["BreadcrumbList"]],
    ["/fa/shop", ["BreadcrumbList"]],
    ["/fa/tours/intro", ["BreadcrumbList"]],
    ["/fa/tours/explore", ["BreadcrumbList"]],
    ["/fa/stays/intro", ["BreadcrumbList"]],
    ["/fa/stays/explore", ["BreadcrumbList"]],
  ];
  for (const [path, expected] of cases) {
    const nodes = nodesOf(await (await request.get(path)).text());
    for (const type of expected) {
      const node = nodes.find((n) => [n["@type"]].flat().includes(type));
      expect(node, `${path} ${type}`).toBeTruthy();
      if (type === "BreadcrumbList") {
        const items = node!.itemListElement;
        expect(items.length, path).toBeGreaterThanOrEqual(2);
        items.forEach((item: any, index: number) => {
          expect(item.position, path).toBe(index + 1);
          expect(item.name, path).toBeTruthy();
          expect(item.item, path).toMatch(new RegExp(`^${origin}/`));
        });
        expect(items[0].item, path).toBe(`${origin}/fa`);
      }
      if (type === "Organization") expect(node!.logo, path).toBeTruthy();
    }
  }
});

// --- Readable URLs (2026-11-16) ---

test("tours and stays live at /tours/<slug> and /stays/<slug>; the old t/ and p/ paths move once", async ({ request }) => {
  const slug = process.env.SEO_E2E_TOUR_SLUG || "kish-island-beaches-and-sunset";
  const moved = await request.get(`/fa/tours/t/${slug}`, { maxRedirects: 0 });
  expect([301, 308]).toContain(moved.status());
  expect(new URL(moved.headers()["location"], "http://x").pathname).toBe(`/fa/tours/${slug}`);
  const page = await request.get(`/fa/tours/${slug}`, { maxRedirects: 0 });
  expect(page.status()).toBe(200);
  expect(canonicalOf(await page.text())).toBe(`${origin}/fa/tours/${slug}`);
  const book = await request.get(`/fa/tours/t/${slug}/book`, { maxRedirects: 0 });
  expect(new URL(book.headers()["location"], "http://x").pathname).toBe(`/fa/tours/${slug}/book`);
  // The app's own sections still win over a slug.
  expect((await request.get("/fa/tours/explore", { maxRedirects: 0 })).status()).toBe(200);
  const stay = await request.get("/fa/stays/p/some-stay", { maxRedirects: 0 });
  expect([301, 308]).toContain(stay.status());
  expect(new URL(stay.headers()["location"], "http://x").pathname).toBe("/fa/stays/some-stay");
  expect((await request.get("/fa/stays/explore", { maxRedirects: 0 })).status()).toBe(200);
});

test("product URLs describe the product; a retired code slug moves once to it", async ({ request }) => {
  const xml = await (await request.get("/sitemap.xml")).text();
  const slugs = [...xml.matchAll(/<loc>[^<]*\/fa\/products\/([^<]+)<\/loc>/g)].map((m) => decodeURIComponent(m[1]));
  expect(slugs.length).toBeGreaterThan(0);
  const words = (s: string) => s.split("-").filter((w) => /^[a-z]{3,}$/.test(w)).length;
  const weak = slugs.filter((s) => words(s) < 2);
  // Only products without an English name may keep a short slug.
  expect(weak.length, weak.slice(0, 10).join(", ")).toBeLessThanOrEqual(Math.ceil(slugs.length * 0.05));
  const previous = process.env.SEO_E2E_PREVIOUS_PRODUCT_SLUG || "v209";
  const moved = await request.get(`/fa/products/${previous}`, { maxRedirects: 0 });
  // The product page streams (loading boundary), so an old slug is answered by
  // an instant meta refresh, which Google treats as a permanent redirect; a
  // 308 is accepted too.
  const location =
    moved.status() === 200
      ? (await moved.text()).match(/<meta[^>]*http-equiv="refresh"[^>]*content="0;\s*url=([^"]+)"/i)?.[1]
      : moved.headers()["location"];
  expect([200, 301, 308]).toContain(moved.status());
  expect(location, "redirect target").toBeTruthy();
  const target = new URL(location!.replace(/&amp;/g, "&"), "http://x").pathname;
  expect(target).toMatch(/^\/fa\/products\/[a-z0-9-]+$/);
  expect(words(target.split("/").pop()!)).toBeGreaterThanOrEqual(2);
  expect((await request.get(target, { maxRedirects: 0 })).status()).toBe(200);
  // Crawlers get blocking metadata (next.config htmlLimitedBots): the redirect
  // is a 308, or an instant meta refresh inside <head> (which Google treats as
  // permanent) — never one streamed into the body.
  const asGooglebot = await request.get(`/fa/products/${previous}`, {
    maxRedirects: 0,
    headers: { "user-agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)" },
  });
  if (asGooglebot.status() === 200) {
    const head = (await asGooglebot.text()).split("</head>")[0];
    const refresh = head.match(/<meta[^>]*http-equiv="refresh"[^>]*content="0;\s*url=([^"]+)"/i)?.[1];
    expect(refresh, "meta refresh inside <head> for crawlers").toBeTruthy();
    expect(new URL(refresh!.replace(/&amp;/g, "&"), "http://x").pathname).toBe(target);
  } else {
    expect([301, 308]).toContain(asGooglebot.status());
    expect(new URL(asGooglebot.headers()["location"], "http://x").pathname).toBe(target);
  }
});

test("a renamed tour's old slug moves once to its current URL", async ({ request }) => {
  const previous = process.env.SEO_E2E_PREVIOUS_TOUR_SLUG;
  test.skip(!previous, "SEO_E2E_PREVIOUS_TOUR_SLUG names a slug kept in tour.tour_slug_history");
  const moved = await request.get(`/fa/tours/${previous}`, { maxRedirects: 0 });
  expect([301, 308]).toContain(moved.status());
  const target = new URL(moved.headers()["location"], "http://x").pathname;
  expect(target).toMatch(/^\/fa\/tours\/[a-z0-9-]+$/);
  expect(target).not.toBe(`/fa/tours/${previous}`);
  expect((await request.get(target, { maxRedirects: 0 })).status()).toBe(200);
});
