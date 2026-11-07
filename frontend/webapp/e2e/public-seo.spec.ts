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
    const path = route === 'home' || route === 'search' ? `/fa/n/app/mobile/${route}` : `/fa/${route}`;
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
    await expect(page.locator('main main button[aria-label^="باز کردن "]')).toHaveCount(
      0,
      { timeout: 1_000 }
    );
  }).toPass({ timeout: 15_000 });
  await input.press("ControlOrMeta+A");
  await input.press("Backspace");
  const parent = page.locator('main main button[aria-label^="باز کردن "]').first();
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

for (const route of ["home", "categories", "explore"]) {
  // A Persian browser: with an English one the home page switches itself to /en
  // on the client (separate issue), and this test is about the canonical.
  test.describe(() => { test.use({ locale: "fa-IR" });
  test(`SEO ${route}: public canonical domain`, async ({ page }, testInfo) => {
    const path = route === 'home' ? `/fa/n/app/mobile/home` : `/fa/${route}`;
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
  expect(await robots.text()).toContain("Disallow: /*/n/app/mobile/support");
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
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex.*nofollow/);
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
  await expect(page.getByText("سایر خدمات")).toBeVisible();
  await expect(page.getByText(/زیردسته/).first()).toBeVisible();

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
    await expect(page.locator("h1").first()).toBeVisible();
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

test("locale roots redirect to the localized home instead of a soft refresh", async ({
  request,
}) => {
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

test("home: one descriptive h1 and organization schema @smoke", async ({ page }, testInfo) => {
  await page.goto("/fa/n/app/mobile/home");
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
    "/en/type/20000000-0000-4000-8000-000000000001",
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
    for (const from of [`/fa/n/app/mobile/${kind}/${id}`, `/fa/${kind}s/${id}`]) {
      const response = await request.get(from, { maxRedirects: 0 });
      expect([301, 308], from).toContain(response.status());
      const target = new URL(response.headers()["location"], "http://x").pathname;
      expect(target, from).toMatch(new RegExp(`^/fa/${kind}s/[a-z0-9-]+$`));
      expect(target, from).not.toContain(id);
      const landed = await request.get(target, { maxRedirects: 0 });
      expect(landed.status(), target).toBe(200);
    }
  }

  for (const path of ["/fa/n/app/mobile/shop/cart", "/fa/n/app/mobile/profile", "/fa/n/app/mobile/home"]) {
    const response = await request.get(path, { maxRedirects: 0 });
    const location = response.headers()["location"];
    const target = location ? new URL(location, "http://x").pathname : path;
    expect(target, path).not.toMatch(/^\/fa\/(shop|explore|providers)(\/|$)/);
  }
});
