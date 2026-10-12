import { expect, test, type Page } from "@playwright/test";

// Release smoke test. Point E2E_BASE_URL at the environment under test
// (e.g. an SSH tunnel to a new server) to catch catastrophic failures:
// 5xx responses, missing database data, broken auth session endpoint.

const HOME = "/en/n/app/mobile/home?countryCode=TR&cityCode=ISTANBUL&lat=41.0146&lng=28.9532";

function collectServerErrors(page: Page, baseURL: string | undefined) {
  const origin = baseURL ? new URL(baseURL).origin : "";
  const failures: string[] = [];
  page.on("response", (response) => {
    if (response.url().startsWith(origin) && response.status() >= 500) {
      failures.push(`${response.status()} ${response.url()}`);
    }
  });
  return failures;
}

test.describe("release smoke", () => {
  test("home loads with database-backed content and no 5xx", async ({ page, baseURL }) => {
    const failures = collectServerErrors(page, baseURL);
    await page.goto(HOME);
    await expect(page).toHaveTitle(/Sevin/i);
    await expect(page.getByRole("heading", { name: "Explore Categories" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Trusted Providers" })).toBeVisible();
    // Category images come from the media store through the API, so this fails
    // if the database or object storage was not restored.
    const categoryImages = page.locator('img[src*="Categories"], img[srcset*="Categories"]');
    await expect.poll(() => categoryImages.count(), { timeout: 30_000 }).toBeGreaterThan(5);
    expect(failures).toEqual([]);
  });

  test("direct navigation and refresh keep the same content", async ({ page }) => {
    await page.goto(HOME);
    const before = await page.getByRole("heading", { level: 2 }).allTextContents();
    expect(before.length).toBeGreaterThan(3);
    await page.reload();
    const after = await page.getByRole("heading", { level: 2 }).allTextContents();
    expect(after).toEqual(before);
  });

  test("sign-in page is reachable by direct URL", async ({ page, baseURL }) => {
    const failures = collectServerErrors(page, baseURL);
    const response = await page.goto("/en/sign-in");
    expect(response?.status()).toBeLessThan(400);
    await expect(page.locator("input").first()).toBeVisible();
    expect(failures).toEqual([]);
  });

  test("auth session endpoint responds for anonymous visitors", async ({ request }) => {
    const response = await request.get("/api/auth/session");
    expect(response.status()).toBe(200);
  });

  test("unknown route returns a 404 page, not a 5xx", async ({ request }) => {
    const response = await request.get("/en/this-route-does-not-exist-smoke");
    expect(response.status()).toBe(404);
  });
});
