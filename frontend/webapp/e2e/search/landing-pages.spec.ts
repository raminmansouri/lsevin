import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";
import postgres from "postgres";

/**
 * Treatment-in-city landing pages (/find/<treatment>/<city>), as a crawler and a visitor see them.
 * Needs the app started with SEARCH_LANDING_PAGES=1 and NEXT_PUBLIC_URL = the base URL.
 * Seeds its own data (database name must end in "_it") and removes it afterwards.
 */
const DB =
  process.env.SEARCH_E2E_DATABASE_URL ||
  "postgres://lsevin:lsevin@127.0.0.1:55432/lsevin_search_it";
const sql = postgres(DB, { max: 2, onnotice: () => {} });
const defId = randomUUID();
const slug = `e2e-rhino-${defId.slice(0, 6)}`;
const PAGE = `/fa/find/${slug}/tehran`;

test.beforeAll(async () => {
  if (!new URL(DB).pathname.endsWith("_it"))
    throw new Error("SEARCH_E2E_DATABASE_URL must end in _it");
  const categoryId = (
    await sql`select id::text as id from category.categories limit 1`
  )[0].id;
  await sql`
    insert into category.service_definitions (id, name_translations, description_translations, category_id, duration_minutes, pricing_model, is_active, currency, value)
    values (${defId}, ${sql.json({ "en-US": slug.replace(/-/g, " "), "fa-IR": "جراحی بینی آزمون" })}, ${sql.json({})}, ${categoryId}, 60, 'Fixed', true, 'IRR', 1)`;
  const offers: [string, string, number][] = [
    ["tehran", "a", 90_000_000],
    ["tehran", "b", 70_000_000],
    ["tehran", "c", 120_000_000],
    ["shiraz", "a", 60_000_000],
    ["shiraz", "b", 65_000_000],
    ["shiraz", "c", 62_000_000],
    ["isfahan", "a", 50_000_000],
    ["isfahan", "b", 55_000_000], // only two providers: no page
  ];
  for (const [city, provider, price] of offers) {
    await sql`
      insert into unified_search.documents (doc_type, source_id, title, subtitle, url, city, price_toman, rating, quality, service_key, provider_id, search_text, content_hash)
      values ('offer', ${`e2e-${defId}-${city}-${provider}`}, ${sql.json({ "fa-IR": "جراحی بینی" })}, ${sql.json({ "fa-IR": `کلینیک ${provider}-${city}` })},
              ${`/services/e2e-${provider}-${city}`}, ${city}, ${price}, 4.4, 0.6, ${defId}, ${`${provider}-${city}`}, 'x', 'h')`;
  }
});
test.afterAll(async () => {
  await sql`delete from unified_search.documents where service_key = ${defId}`;
  await sql`delete from category.service_definitions where id = ${defId}`;
  await sql.end({ timeout: 2 });
});

test.describe("landing pages", () => {
  test("@critical a qualifying page: heading, facts, providers with prices, internal links", async ({
    page,
  }) => {
    const response = await page.goto(PAGE);
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "جراحی بینی آزمون در تهران"
    );
    await expect(page.getByTestId("landing-intro")).toContainText(
      "۳ مرکز درمانی"
    );
    await expect(page.getByTestId("landing-intro")).toContainText("۷۰٬۰۰۰٬۰۰۰");
    await expect(
      page.getByTestId("landing-offers").getByRole("listitem")
    ).toHaveCount(3);
    // The cheapest of the three is listed with its price and links to the provider's own page.
    const first = page.getByTestId("landing-offers").getByRole("link").first();
    await expect(first).toHaveAttribute("href", /\/fa\/services\/e2e-/);
    // Other cities offering the same treatment are linked; the page without enough providers is not.
    const nav = page.getByRole("navigation", { name: /در شهرهای دیگر/ });
    await expect(nav.getByRole("link", { name: "شیراز" })).toHaveAttribute(
      "href",
      `/fa/find/${slug}/shiraz`
    );
    await expect(nav.getByRole("link", { name: "اصفهان" })).toHaveCount(0);
  });

  test("@critical SEO: canonical, hreflang for fa+en only, indexable, valid JSON-LD with absolute URLs", async ({
    page,
    baseURL,
  }) => {
    await page.goto(PAGE);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      `${baseURL}${PAGE}`
    );
    const alternates = await page
      .locator('link[rel="alternate"][hreflang]')
      .evaluateAll((els) =>
        els.map(
          (el) => `${el.getAttribute("hreflang")}=${el.getAttribute("href")}`
        )
      );
    expect(alternates.map((a) => a.split("=")[0]).sort()).toEqual([
      "en",
      "fa",
      "x-default",
    ]);
    expect(alternates.find((a) => a.startsWith("en="))).toContain(
      `/en/find/${slug}/tehran`
    );
    await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
    expect(await page.title()).toContain("جراحی بینی آزمون در تهران");
    expect(
      await page.locator('meta[name="description"]').getAttribute("content")
    ).toContain("۳");

    const blocks = await page
      .locator('script[type="application/ld+json"]')
      .evaluateAll((els) =>
        els.map((el) => JSON.parse(el.textContent ?? "null"))
      );
    const flat = blocks.flat();
    const list = flat.find(
      (b: { "@type": string }) => b["@type"] === "ItemList"
    );
    const crumbs = flat.find(
      (b: { "@type": string }) => b["@type"] === "BreadcrumbList"
    );
    expect(list.numberOfItems).toBe(3);
    for (const item of list.itemListElement)
      expect(item.url).toMatch(new RegExp(`^${baseURL}/fa/services/`));
    expect(crumbs.itemListElement).toHaveLength(2);
  });

  test("a language without its own text is kept out of the index", async ({
    page,
  }) => {
    await page.goto(`/tr/find/${slug}/tehran`);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      "content",
      /noindex/
    );
    await expect(page.locator('link[rel="alternate"][hreflang]')).toHaveCount(
      0
    );
  });

  test("English page is left-to-right with English copy", async ({ page }) => {
    await page.goto(`/en/find/${slug}/tehran`);
    await expect(page.getByTestId("landing-page")).toHaveAttribute(
      "dir",
      "ltr"
    );
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "in Tehran"
    );
    await expect(page.getByTestId("landing-intro")).toContainText(
      "3 providers"
    );
  });

  test("@critical combinations without enough providers, or unknown slugs, are 404 and never indexed", async ({
    page,
  }) => {
    for (const path of [
      `/fa/find/${slug}/isfahan`,
      `/fa/find/${slug}/nowhere`,
      `/fa/find/no-such-treatment/tehran`,
      `/fa/find/${slug}/TEHRAN`,
      `/fa/find/..%2Fetc/tehran`,
    ]) {
      const response = await page.goto(path);
      expect(response?.status(), path).toBe(404);
    }
  });

  test("refresh and navigation between landing pages", async ({ page }) => {
    await page.goto(PAGE);
    await page.reload();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "جراحی بینی آزمون در تهران"
    );
    await page
      .getByRole("navigation", { name: /در شهرهای دیگر/ })
      .getByRole("link", { name: "شیراز" })
      .click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "جراحی بینی آزمون در شیراز"
    );
    await page.goBack();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "جراحی بینی آزمون در تهران"
    );
  });

  test("the call to action opens search with the treatment and city prefilled", async ({
    page,
  }) => {
    await page.goto(PAGE);
    await page.getByRole("link", { name: /جستجوی دقیق‌تر/ }).click();
    await expect(page).toHaveURL(/\/fa\/search\?q=/);
    await expect(page.getByRole("combobox")).toHaveValue(
      "جراحی بینی آزمون تهران"
    );
  });

  test("@mobile no horizontal overflow at 360px", async ({ page }) => {
    await page.goto(PAGE);
    await expect(page.getByTestId("landing-offers")).toBeVisible();
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth
      )
    ).toBeLessThanOrEqual(0);
  });

  test("@critical the real sitemap lists the qualifying pages (fa+en with alternates) and no thin ones", async ({
    request,
    baseURL,
  }) => {
    test.skip(
      !process.env.SEARCH_E2E_SITEMAP,
      "set SEARCH_E2E_SITEMAP=1 when the base URL serves the app's sitemap"
    );
    // The landing entries are cached (stale-while-revalidate): the app is started with SEARCH_LANDING_SITEMAP_REVALIDATE=1 and a refresh may take a request or two.
    let xml = "";
    for (let attempt = 0; attempt < 12; attempt += 1) {
      const response = await request.get("/sitemap.xml");
      expect(response.status()).toBe(200);
      xml = await response.text();
      if (xml.includes(`/fa/find/${slug}/tehran`)) break;
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }
    expect(xml).toContain(`${baseURL}/fa/find/${slug}/tehran`);
    expect(xml).toContain(`${baseURL}/en/find/${slug}/tehran`);
    expect(xml).toContain(`${baseURL}/fa/find/${slug}/shiraz`);
    expect(xml).not.toContain(`/find/${slug}/isfahan`);
    expect(xml).not.toContain(`/tr/find/${slug}`);
  });
});
