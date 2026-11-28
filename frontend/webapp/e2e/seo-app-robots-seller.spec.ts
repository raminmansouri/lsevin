import { expect, test } from "@playwright/test";

const app = process.env.E2E_BASE_URL || "http://localhost:3101";
const sellerSlug = process.env.E2E_SELLER_SLUG || "lsevin";
const productSlug = process.env.E2E_PRODUCT_SLUG || "";
const primaryHost = { Host: "lsevincare.com" };
const NOINDEX_META = /<meta[^>]+name="robots"[^>]+content="[^"]*noindex/i;

test("app-only addresses are crawlable but noindex, follow", async ({ request }) => {
  for (const path of ["/fa/n/app/mobile/search", "/fa/n/app/mobile/search-results?q=test"]) {
    const response = await request.get(`${app}${path}`, { headers: primaryHost });
    expect(response.status(), path).toBe(200);
    expect(response.headers()["x-robots-tag"], path).toBe("noindex, follow");
  }
});

// The public pages are rewrites onto the app routes: from 2026-11-23 to 11-26 a
// robots policy on the app layout kept them all out of Google.
test("public pages served from app routes are indexable", async ({ request }) => {
  const paths = ["/fa", "/en", "/fa/explore", "/fa/shop", "/fa/providers", "/fa/categories", "/fa/offers"];
  if (productSlug) paths.push(`/fa/products/${productSlug}`);
  for (const path of paths) {
    const response = await request.get(`${app}${path}`, { headers: primaryHost });
    expect(response.status(), path).toBe(200);
    expect(response.headers()["x-robots-tag"], path).toBeUndefined();
    const html = await response.text();
    expect(html, path).not.toMatch(NOINDEX_META);
    expect(html, path).toContain(`<link rel="canonical" href="https://lsevincare.com${path}"`);
  }
});

test("old seller URL redirects to the indexable public page", async ({ request }) => {
  const old = await request.get(`${app}/fa/n/app/mobile/shop/seller/${sellerSlug}`, { maxRedirects: 0, headers: primaryHost });
  expect(old.status()).toBe(308);
  expect(new URL(old.headers().location, app).pathname).toBe(`/fa/shop/seller/${sellerSlug}`);

  const page = await request.get(`${app}/fa/shop/seller/${sellerSlug}`, { headers: primaryHost });
  expect(page.status()).toBe(200);
  const html = await page.text();
  expect(html).toMatch(/<title>[^<]+<\/title>/i);
  expect(html).toContain(`https://lsevincare.com/fa/shop/seller/${sellerSlug}`);
  expect(html).not.toMatch(NOINDEX_META);
  expect(page.headers()["x-robots-tag"]).toBeUndefined();
});

test("service gallery is noindex, follow with the service page as canonical", async ({ request }) => {
  const service = process.env.E2E_SERVICE_SLUG;
  test.skip(!service, "set E2E_SERVICE_SLUG to a service with a gallery");
  const response = await request.get(`${app}/fa/services/${service}/gallery`, { headers: primaryHost });
  expect(response.status()).toBe(200);
  expect(response.headers()["x-robots-tag"]).toBe("noindex, follow");
  const html = await response.text();
  expect(html).toMatch(/<meta[^>]+name="robots"[^>]+content="noindex, follow"/i);
  expect(html).toContain(`rel="canonical" href="https://lsevincare.com/fa/services/${service}"`);
  expect(html).not.toMatch(/rel="alternate"[^>]+hrefLang/i);
});
