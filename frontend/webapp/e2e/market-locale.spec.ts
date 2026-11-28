import { expect, test, type Page } from "@playwright/test";
import postgres from "postgres";

/**
 * Visitor language, prices and location (reported 2026-11-12 and 2026-11-14):
 *   - a private window from Turkey opened in Persian, prices stayed in rial after
 *     switching to Turkish, rial was doubled for non-Persian pages;
 *   - the map opened on Tehran; the home location picker had three dropdowns and
 *     could not find Turkey or Istanbul.
 *
 * The visitor's country comes from Cloudflare's CF-IPCountry header in
 * production. Locally there is no Cloudflare, so the tests send that header
 * themselves — this checks the app's rules, not Cloudflare (production is
 * checked separately by requesting the live site from real networks).
 *
 *   MARKET_BASE_URL=http://127.0.0.1:3144 \
 *   MARKET_DATABASE_URL=postgres://…@127.0.0.1:<port>/<the server's db> \
 *   npx playwright test -c playwright.market.config.ts
 */

const DB_URL = process.env.MARKET_DATABASE_URL || "";
const PHONE = { width: 390, height: 844 };

/**
 * A real browser starts at "prompt" for location; headless Chrome reports
 * "denied" unless a permission is granted, so the first-visit path is simulated.
 */
async function permissionPrompt(page: Page) {
  await page.addInitScript(() => {
    // The dev server's "Issues" badge sits over the sheet's buttons; production has none.
    document.addEventListener("DOMContentLoaded", () => {
      const style = document.createElement("style");
      style.textContent = "nextjs-portal{display:none!important}";
      document.head.appendChild(style);
    });
    const original = navigator.permissions?.query?.bind(navigator.permissions);
    if (!original) return;
    navigator.permissions.query = ((descriptor: PermissionDescriptor) =>
      descriptor?.name === "geolocation"
        ? Promise.resolve({ state: "prompt", name: "geolocation", onchange: null, addEventListener() {}, removeEventListener() {}, dispatchEvent: () => true } as unknown as PermissionStatus)
        : original(descriptor)) as typeof navigator.permissions.query;
  });
}

const WIDTHS = [
  { name: "phone", width: 390, height: 844 },
  { name: "desktop", width: 1440, height: 900 },
];

let serviceSlug = "";
let sourceAmount = 0;
let sourceCurrency = "";

test.beforeAll(async () => {
  test.skip(!DB_URL, "Set MARKET_DATABASE_URL to the database the server under test reads.");
  const sql = postgres(DB_URL, { max: 1, prepare: false });
  try {
    // An active service priced in rial, with the default multiplier, on a public provider.
    const [row] = await sql<{ slug: string; value: string; currency: string }[]>`
      select ps.slug, ps.value::text as value, ps.currency
        from category.provider_services ps
        join category.service_providers sp on sp.id = ps.service_provider_id
       where ps.is_active and sp.is_active and ps.slug is not null and ps.currency = 'IRR'
         and ps.value > 0 and coalesce(ps.value_toman, 0) = 0
         and category.provider_type_is_public(sp.provider_type_id)
       order by ps.value limit 1 offset (
         select count(*) / 2 from category.provider_services x where x.is_active and x.currency = 'IRR' and x.value > 0)`;
    expect(row, "a rial-priced service").toBeTruthy();
    serviceSlug = row.slug;
    sourceAmount = Number(row.value);
    sourceCurrency = row.currency;
  } finally {
    await sql.end();
  }
});

async function settle(page: Page) {
  await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => {});
}

/** Every price the page shows, with the currency it is in. */
async function prices(page: Page) {
  await expect(page.locator('[data-testid="price-amount"]:visible').first()).toBeVisible({ timeout: 60_000 });
  return page.locator('[data-testid="price-amount"]:visible').evaluateAll((nodes) =>
    nodes.map((node) => ({ currency: node.getAttribute("data-currency"), text: (node.textContent || "").trim() })),
  );
}

test.describe("first visit: language from choice, IP, browser, phone", () => {
  const cases: { name: string; headers: Record<string, string>; cookie?: string; ua?: string; to: string }[] = [
    { name: "Turkey", headers: { "cf-ipcountry": "TR", "accept-language": "fa-IR,fa;q=0.9" }, to: "/tr" },
    { name: "Iran", headers: { "cf-ipcountry": "IR", "accept-language": "en-US" }, to: "/fa" },
    { name: "UAE", headers: { "cf-ipcountry": "AE" }, to: "/ar" },
    { name: "Iraq", headers: { "cf-ipcountry": "IQ" }, to: "/ar" },
    { name: "Oman", headers: { "cf-ipcountry": "OM" }, to: "/ar" },
    { name: "Germany, browser Persian", headers: { "cf-ipcountry": "DE", "accept-language": "fa" }, to: "/fa" },
    { name: "Germany, browser German", headers: { "cf-ipcountry": "DE", "accept-language": "de-DE" }, to: "/en" },
    { name: "unknown country", headers: { "cf-ipcountry": "XX" }, to: "/fa" },
    { name: "own choice beats IP", headers: { "cf-ipcountry": "TR" }, cookie: "NEXT_LOCALE=en", to: "/en" },
    // Google: treat Googlebot like any visitor from the country it crawls from
    // (locale-adaptive pages); it sends no Accept-Language.
    { name: "US visitor", headers: { "cf-ipcountry": "US" }, to: "/en" },
    { name: "Googlebot from the US, like a US visitor", headers: { "cf-ipcountry": "US" }, ua: "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)", to: "/en" },
    { name: "Googlebot from Iran, like an Iranian visitor", headers: { "cf-ipcountry": "IR" }, ua: "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)", to: "/fa" },
    { name: "Googlebot from Turkey, like a Turkish visitor", headers: { "cf-ipcountry": "TR" }, ua: "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)", to: "/tr" },
  ];
  for (const item of cases) {
    test(`${item.name} -> ${item.to}`, async ({ request }) => {
      const response = await request.get("/", {
        maxRedirects: 0,
        headers: { ...item.headers, ...(item.cookie ? { cookie: item.cookie } : {}), ...(item.ua ? { "user-agent": item.ua } : {}) },
      });
      expect(response.status()).toBe(307);
      expect(new URL(response.headers()["location"], "http://x").pathname).toBe(item.to);
      expect(response.headers()["cache-control"]).toContain("no-store");
    });
  }

  test("a private window from Turkey opens Turkish, LTR, in lira", async ({ browser }) => {
    const context = await browser.newContext({ extraHTTPHeaders: { "cf-ipcountry": "TR" }, locale: "fa-IR" });
    const page = await context.newPage();
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/tr$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "tr");
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
    await settle(page);
    for (const price of await prices(page)) expect(price.currency, price.text).toMatch(/^(TRY|USD)$/);
    await context.close();
  });
});

test.describe("prices follow the language", () => {
  for (const size of WIDTHS) {
    test(`service page, same price on phone and desktop, never doubled rial (${size.name})`, async ({ browser }) => {
      const seen: Record<string, string[]> = {};
      for (const [locale, country, currency] of [
        ["fa", "IR", "IRT"],
        ["tr", "TR", "TRY"],
        ["en", "TR", "USD"],
        ["ar", "AE", "AED"],
      ] as const) {
        const context = await browser.newContext({ extraHTTPHeaders: { "cf-ipcountry": country }, viewport: size });
        const page = await context.newPage();
        await page.goto(`/${locale}/services/${serviceSlug}`, { waitUntil: "domcontentloaded" });
        await settle(page);
        const shown = await prices(page);
        seen[locale] = shown.map((p) => `${p.currency} ${p.text}`);
        // The headline price is in the language's currency (or USD when that currency has no rate).
        expect(shown.some((p) => p.currency === currency || (currency !== "IRT" && p.currency === "USD")), `${locale}: ${seen[locale]}`).toBe(true);
        if (locale !== "fa") {
          // Reported: a rial amount, doubled, on the Turkish page.
          for (const price of shown) expect(price.currency, `${locale}: ${price.text}`).not.toMatch(/^(IRR|IRT)$/);
          await expect(page.locator("body")).not.toContainText("ریال");
        }
        await context.close();
      }
      test.info().annotations.push({ type: "prices", description: JSON.stringify({ sourceAmount, sourceCurrency, seen }) });
    });
  }

  test("home and explore cards: one currency per page", async ({ browser }) => {
    for (const [locale, country] of [["tr", "TR"], ["fa", "IR"]] as const) {
      const context = await browser.newContext({ extraHTTPHeaders: { "cf-ipcountry": country } });
      const page = await context.newPage();
      for (const path of [`/${locale}`, `/${locale}/explore`]) {
        await page.goto(path, { waitUntil: "domcontentloaded" });
        await settle(page);
        // Reported: rial and dollars side by side on one page.
        for (const price of await prices(page)) {
          expect(price.currency, `${path} ${price.text}`).toMatch(locale === "fa" ? /^IRT$/ : /^(TRY|USD)$/);
        }
      }
      await context.close();
    }
  });
});

test.describe("home location picker", () => {
  test("asks politely on the first visit, then one search finds Turkey and Istanbul", async ({ browser }) => {
    const context = await browser.newContext({ extraHTTPHeaders: { "cf-ipcountry": "TR" }, permissions: [], viewport: PHONE });
    const page = await context.newPage();
    await permissionPrompt(page);
    await page.goto("/tr", { waitUntil: "domcontentloaded" });
    // No click needed: our own question comes first, not the browser prompt,
    // and as a small card rather than a sheet over the page.
    const ask = page.getByTestId("home-location-ask");
    await expect(ask).toBeVisible({ timeout: 20_000 });
    await expect(ask).toContainText("Konumu aç");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await ask.getByRole("button", { name: "Şimdi değil" }).click();
    await expect(ask).toBeHidden();

    // Choosing by hand is one tap on the destination.
    await page.getByRole("button", { name: /Hedef/ }).click();
    const search = page.getByTestId("place-search-input");
    await expect(search).toBeVisible();
    // One box, not three dropdowns.
    await expect(page.getByRole("combobox")).toHaveCount(1);

    await search.fill("Turkey");
    // The first search can be slow on a cold dev server; production answers in ms.
    await expect(page.getByTestId("place-search-option").first()).toContainText("Türkiye", { timeout: 90_000 });
    await search.fill("istanbul");
    const option = page.getByTestId("place-search-option").first();
    await expect(option).toContainText(/İstanbul|Istanbul/);
    await search.press("Enter");
    await expect(page).toHaveURL(/cityCode=/);
    await settle(page);
    await expect(page.locator("body")).toContainText(/İstanbul|Istanbul/);

    // Kept after a refresh.
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.locator("body")).toContainText(/İstanbul|Istanbul/);
    await context.close();
  });

  test("Persian and Arabic names, and a denied permission explains how to allow it", async ({ browser }) => {
    const context = await browser.newContext({ extraHTTPHeaders: { "cf-ipcountry": "IR" }, permissions: [], viewport: PHONE });
    const page = await context.newPage();
    await permissionPrompt(page);
    await page.goto("/fa", { waitUntil: "domcontentloaded" });
    const ask = page.getByTestId("home-location-ask");
    await expect(ask).toBeVisible({ timeout: 20_000 });
    // Playwright answers the browser prompt with "denied" when no permission is granted.
    await ask.getByRole("button", { name: "فعال‌سازی" }).click();
    await expect(page.getByTestId("location-denied-help")).toBeVisible({ timeout: 20_000 });
    const search = page.getByTestId("place-search-input");
    await search.fill("استانبول");
    await expect(page.getByTestId("place-search-option").first()).toContainText("استانبول");
    await search.fill("اسطنبول");
    await expect(page.getByTestId("place-search-option").first()).toContainText("استانبول");
    // A modal sheet closes with Escape.
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await context.close();
  });
});

test.describe("map", () => {
  test("asks politely before the browser does, and uses the position when allowed", async ({ browser }) => {
    const context = await browser.newContext({
      extraHTTPHeaders: { "cf-ipcountry": "TR" },
      viewport: { width: 390, height: 844 },
      permissions: [],
    });
    const page = await context.newPage();
    await permissionPrompt(page);
    await page.goto("/tr/map", { waitUntil: "domcontentloaded" });
    const ask = page.getByTestId("map-location-ask");
    await expect(ask).toBeVisible({ timeout: 20_000 });
    await ask.getByRole("button", { name: "Şimdi değil" }).click();
    await expect(ask).toBeHidden();
    await context.close();

    // Already refused in the browser: no card, the map stays on the country.
    const refused = await browser.newContext({ extraHTTPHeaders: { "cf-ipcountry": "TR" }, viewport: PHONE, permissions: [] });
    const page1 = await refused.newPage();
    await page1.goto("/tr/map", { waitUntil: "domcontentloaded" });
    await settle(page1);
    await expect(page1.getByTestId("map-location-ask")).toHaveCount(0);
    await refused.close();

    const allowed = await browser.newContext({
      extraHTTPHeaders: { "cf-ipcountry": "TR" },
      viewport: { width: 390, height: 844 },
      permissions: ["geolocation"],
      geolocation: { latitude: 41.0138, longitude: 28.9497 },
    });
    const page2 = await allowed.newPage();
    await page2.goto("/tr/map", { waitUntil: "domcontentloaded" });
    // Already allowed: no card, the map moves to the visitor.
    await expect(page2).toHaveURL(/lat=41\.01/, { timeout: 20_000 });
    await expect(page2.getByTestId("map-location-ask")).toHaveCount(0);
    await allowed.close();
  });

  test("without a position the map opens on the visitor's country, not Tehran", async ({ request }) => {
    const html = await (await request.get("/tr/map", { headers: { "cf-ipcountry": "TR" } })).text();
    // The map center is in the page data: Istanbul (41.0, 28.9), not Tehran (35.7, 51.4).
    expect(html).toMatch(/\\?"mapCenter\\?":\{\\?"lat\\?":41\.0/);
  });
});

// Google (locale-adaptive pages): robots rules must be the same whatever locale
// or country a request comes from, and a URL that names a language is never
// redirected, so every version is crawlable from anywhere.
test("a language URL serves the same page and robots rules to every country and browser language", async ({ request }) => {
  for (const path of ["/fa/providers", "/en/explore", "/tr", "/ar/categories"]) {
    const seen: string[] = [];
    for (const headers of [{ "cf-ipcountry": "US" }, { "cf-ipcountry": "IR", "accept-language": "fa-IR" }, { "cf-ipcountry": "TR", "accept-language": "tr" }, { "cf-ipcountry": "AE", "accept-language": "ar" }]) {
      const response = await request.get(path, { maxRedirects: 0, headers: { ...headers, "user-agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)" } });
      expect(response.status(), `${path} ${JSON.stringify(headers)}`).toBe(200);
      const html = await response.text();
      const head = html.split("</head>")[0] ?? "";
      const signature = [
        html.match(/<html[^>]* lang="([^"]*)"/)?.[1],
        head.match(/<meta name="robots" content="([^"]*)"/)?.[1] ?? "index",
        head.match(/<link rel="canonical" href="([^"]+)"/)?.[1],
        [...head.matchAll(/hrefLang="([^"]+)" href="([^"]+)"/gi)].map((m) => m[1] + "=" + m[2]).join(","),
      ].join(" | ");
      seen.push(signature);
    }
    expect(new Set(seen).size, `${path}: ${seen[0]}`).toBe(1);
  }
  const robots = await Promise.all(["US", "IR", "TR"].map(async (country) => (await request.get("/robots.txt", { headers: { "cf-ipcountry": country } })).text()));
  expect(new Set(robots).size).toBe(1);
});
