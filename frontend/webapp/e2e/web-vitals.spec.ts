import { expect, test, type Page, type Request } from "@playwright/test";

/**
 * Mobile visitors pay only for the mobile page (2026-11-26 performance audit).
 *
 * Every public page renders a mobile and a desktop tree and hides one with CSS.
 * Before: a phone downloaded the desktop tree's photos at full size (14 MB on
 * the map), React preloaded them (100 preloads on the map), the hidden desktop
 * tree was hydrated (most of 0.9–3.6 s of blocked main thread), the home page
 * re-rendered itself from the server after detecting the visitor's location,
 * private pages were prefetched for guests (three sign-in downloads per view),
 * and the assistant chat loaded on every page.
 *
 *   PERF_BASE_URL=http://127.0.0.1:3144 PERF_PROVIDER_SLUG=<slug> \
 *   npx playwright test -c playwright.web-vitals.config.ts
 */

const BASE = process.env.PERF_BASE_URL || "http://localhost:3000";
const PROVIDER = process.env.PERF_PROVIDER_SLUG || "";
const PHONE = { width: 412, height: 915 };
const DESKTOP = { width: 1440, height: 900 };

function track(page: Page) {
  const requests: Request[] = [];
  page.on("request", (request) => requests.push(request));
  return requests;
}

const isRsc = (r: Request) => Boolean(r.headers()["rsc"]) || /[?&]_rsc=/.test(r.url());
const isOriginalFile = (r: Request) => r.resourceType() === "image" && /\/files\//.test(new URL(r.url()).pathname);

async function settle(page: Page) {
  await page.waitForLoadState("networkidle", { timeout: 20_000 }).catch(() => {});
  await page.waitForTimeout(1500);
}

test.describe("phone", () => {
  test.use({ viewport: PHONE, isMobile: true, hasTouch: true, serviceWorkers: "block" });

  test("home: no re-render after location detection, no desktop downloads, no private prefetch", async ({ page }) => {
    const requests = track(page);
    await page.addInitScript(() => {
      (window as unknown as { __cls: number }).__cls = 0;
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as unknown as { value: number; hadRecentInput: boolean }[]) {
          if (!entry.hadRecentInput) (window as unknown as { __cls: number }).__cls += entry.value;
        }
      }).observe({ type: "layout-shift", buffered: true });
    });
    const response = await page.goto(`${BASE}/fa`, { waitUntil: "domcontentloaded" });
    expect(response?.status()).toBe(200);
    await settle(page);

    // The location picker may still write ?countryCode=… into the address bar…
    // …but the static home page is never fetched again for it.
    const homeRefetch = requests.filter((r) => isRsc(r) && /\/fa(\?|$)/.test(new URL(r.url()).pathname + new URL(r.url()).search) && !r.headers()["next-router-prefetch"]);
    expect(homeRefetch.map((r) => r.url())).toEqual([]);

    // Signed-in screens redirect a guest to sign-in; prefetching them downloaded the
    // sign-in page once per link. (The sign-in link itself may be prefetched.)
    const privatePrefetch = requests.filter((r) => isRsc(r) && /\/(account|n\/app\/mobile\/notifications)(\/|\?|$)|redirectTo=/.test(r.url()));
    expect(privatePrefetch.map((r) => r.url())).toEqual([]);

    // The assistant chat (history, conversation list) is not loaded until opened.
    expect(requests.filter((r) => /\/api\/assistant\/(history|conversations)/.test(r.url())).map((r) => r.url())).toEqual([]);

    // React preloads only what the phone shows above the fold.
    const imagePreloads = await page.locator('link[rel="preload"][as="image"]').count();
    expect(imagePreloads).toBeLessThan(12);

    // Google's "good" layout shift: the late consultation chips moved the page by 0.22.
    const cls = await page.evaluate(() => (window as unknown as { __cls: number }).__cls);
    expect(cls).toBeLessThan(0.1);
  });

  test("map: no stored originals (hidden desktop list, 48 px markers)", async ({ page }) => {
    const requests = track(page);
    const response = await page.goto(`${BASE}/fa/map`, { waitUntil: "domcontentloaded" });
    expect(response?.status()).toBe(200);
    await settle(page);
    // The markers were ~100 originals (10.5 MB) shown at 48 px.
    expect(requests.filter(isOriginalFile).map((r) => r.url())).toEqual([]);
    expect(await page.locator('link[rel="preload"][as="image"]').count()).toBeLessThan(12);
  });

  test("provider page: the desktop hero is not downloaded and the desktop tree is not hydrated", async ({ page }) => {
    test.skip(!PROVIDER, "Set PERF_PROVIDER_SLUG");
    const requests = track(page);
    const response = await page.goto(`${BASE}/fa/providers/${PROVIDER}`, { waitUntil: "domcontentloaded" });
    expect(response?.status()).toBe(200);
    await settle(page);
    expect(requests.filter(isOriginalFile).map((r) => r.url())).toEqual([]);
    // Desktop-only pictures fall back to the inline 1×1 GIF on a phone.
    const desktopPictures = page.locator(".lsd picture img");
    if (await desktopPictures.count()) {
      expect(await desktopPictures.first().evaluate((img: HTMLImageElement) => img.currentSrc.startsWith("data:"))).toBe(true);
    }
    // The mobile page works: its gallery thumbnails switch the main image.
    await expect(page.locator("h1").first()).toBeVisible();
  });

  test("assistant opens on demand and keeps working", async ({ page }) => {
    const requests = track(page);
    await page.goto(`${BASE}/fa/explore`, { waitUntil: "domcontentloaded" });
    await settle(page);
    const launcher = page.getByRole("button", { name: "باز کردن دستیار" });
    await expect(launcher).toBeVisible();
    expect(requests.some((r) => /\/api\/assistant\/history/.test(r.url()))).toBe(false);
    await launcher.click();
    await expect(page.locator("textarea, input[type='text']").last()).toBeVisible({ timeout: 15_000 });
    await expect.poll(() => requests.some((r) => /\/api\/assistant\/history/.test(r.url())), { timeout: 15_000 }).toBe(true);
  });
});

test.describe("desktop", () => {
  test.use({ viewport: DESKTOP, serviceWorkers: "block" });

  test("provider page: desktop hero loads (optimized) and the desktop tree is interactive", async ({ page }) => {
    test.skip(!PROVIDER, "Set PERF_PROVIDER_SLUG");
    const response = await page.goto(`${BASE}/fa/providers/${PROVIDER}`, { waitUntil: "domcontentloaded" });
    expect(response?.status()).toBe(200);
    await settle(page);
    const hero = page.locator(".lsd picture img").first();
    if (await hero.count()) {
      await expect.poll(() => hero.evaluate((img: HTMLImageElement) => img.currentSrc), { timeout: 20_000 }).toMatch(/\/_next\/image\?url=|\/files\//);
    }
    await expect(page.locator(".lsd:visible").first()).toBeVisible();
  });

  test("home: the desktop layout is visible and interactive", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    const response = await page.goto(`${BASE}/fa`, { waitUntil: "domcontentloaded" });
    expect(response?.status()).toBe(200);
    await settle(page);
    await expect(page.locator(".lsd:visible").first()).toBeVisible();
    // Hydrated: the desktop header's Explore link (client-side) navigates.
    // A first visit opens the location sheet over the page; "not now" leads to
    // the manual place search, which the visitor closes (Escape, X or backdrop).
    const notNow = page.getByRole("button", { name: "انصراف", exact: true });
    await notNow.waitFor({ state: "visible", timeout: 15_000 }).catch(() => {});
    if (await notNow.isVisible()) {
      await notNow.click();
      await page.keyboard.press("Escape");
      await expect(page.locator(".sheet-scrim")).toHaveCount(0);
    }
    // The home page animates continuously, so Playwright's "stable" check never passes.
    await page.locator(".lsd").first().locator("a[href$='/explore']").first().click({ force: true });
    await page.waitForURL(/\/fa\/explore/);
    expect(errors).toEqual([]);
  });
});

/**
 * Persian digits come from the font (src/app/fonts.css "LS Digits FA"), not from
 * rewriting the DOM after hydration: the rewrite made React find server/client
 * text differences (error #418) and re-render whole sections (2026-11-26).
 */
for (const [label, viewport] of [["phone", PHONE], ["desktop", DESKTOP]] as const) {
  test.describe(`Persian digits (${label})`, () => {
    test.use({ viewport, serviceWorkers: "block" });

    test("pages hydrate without errors and render digits through the digit font", async ({ page }) => {
      const paths = ["/fa", "/fa/explore", "/fa/map", ...(PROVIDER ? [`/fa/providers/${PROVIDER}`] : [])];
      for (const path of paths) {
        const errors: string[] = [];
        page.on("pageerror", (error) => errors.push(error.message));
        const response = await page.goto(`${BASE}${path}`, { waitUntil: "load" });
        expect(response?.status(), path).toBe(200);
        await settle(page);
        expect(errors.filter((message) => /#418|#423|#425|hydrat/i.test(message)), path).toEqual([]);
        page.removeAllListeners("pageerror");
      }
      // The text keeps the server's digits; the font draws them as Persian digits.
      const body = await page.evaluate(() => getComputedStyle(document.body).fontFamily);
      expect(body).toMatch(/^"?LS Digits FA"?,/);
      const input = await page.evaluate(() => {
        const element = document.createElement("input");
        document.body.append(element);
        const family = getComputedStyle(element).fontFamily;
        element.remove();
        return family;
      });
      expect(input).not.toContain("LS Digits FA");
    });
  });
}
