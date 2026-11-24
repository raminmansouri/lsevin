import { expect, test } from "@playwright/test";

const app = process.env.E2E_BASE_URL || "http://localhost:3101";
const sellerSlug = process.env.E2E_SELLER_SLUG || "lsevin";
const primaryHost = { Host: "lsevincare.com" };

test("app-only pages are crawlable but noindex, follow", async ({ request }) => {
  for (const path of ["/fa/n/app/mobile/consultation/doctors"]) {
    const response = await request.get(`${app}${path}`, { headers: primaryHost });
    expect(response.status(), path).toBe(200);
    expect(response.headers()["x-robots-tag"], path).toBe("noindex, follow");
    expect(await response.text(), path).toMatch(/<meta[^>]+name="robots"[^>]+content="noindex, follow"/i);
  }
});

test("old seller URL redirects to the indexable public page", async ({ request }) => {
  const old = await request.get(`${app}/fa/n/app/mobile/shop/seller/${sellerSlug}`, { maxRedirects: 0, headers: primaryHost });
  expect(old.status()).toBe(308);
  expect(new URL(old.headers().location).pathname).toBe(`/fa/shop/seller/${sellerSlug}`);

  const page = await request.get(`${app}/fa/shop/seller/${sellerSlug}`, { headers: primaryHost });
  expect(page.status()).toBe(200);
  const html = await page.text();
  expect(html).toMatch(/<title>[^<]+<\/title>/i);
  expect(html).toContain(`https://lsevincare.com/fa/shop/seller/${sellerSlug}`);
  expect(html).not.toMatch(/<meta[^>]+name="robots"[^>]+content="[^"]*noindex/i);
  expect(page.headers()["x-robots-tag"]).toBeUndefined();
});
