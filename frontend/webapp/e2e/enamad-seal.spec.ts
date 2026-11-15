import { expect, test, type Page } from '@playwright/test';

/**
 * The Enamad trust seal must be visible on both layouts of the public site: the desktop footer
 * (>= 1280px, every customer page) and the mobile home page. Enamad verifies the seal from the page
 * that shows it, so the link and image keep referrerPolicy "origin" and the image is loaded straight
 * from trustseal.enamad.ir (not through our image optimizer).
 *
 * Each domain has its own seal (admin → Content → Enamad, migration 0107) and the page picks it by
 * the domain it is shown on. localhost has none, so local runs use site-a.localhost, which the test
 * runner seeds with lsevincare.com's seal, and site-b.localhost, seeded with a different one.
 *
 * Run through `pnpm test:local-env --suite site-chrome`, or against a deployed site with
 * E2E_BASE_URL=https://lsevincare.com npx playwright test --config playwright.site-chrome.config.ts
 */

const CONFIGURED_BASE = new URL(process.env.E2E_BASE_URL || 'http://localhost:3140');
const LOCAL = ['localhost', '127.0.0.1'].includes(CONFIGURED_BASE.hostname);
/** The domain the seal checks run on: site-a.localhost locally, otherwise the deployed site itself. */
function onHost(host: string) {
  const url = new URL(CONFIGURED_BASE.toString());
  url.hostname = host;
  return url.origin;
}
const BASE = LOCAL ? onHost('site-a.localhost') : CONFIGURED_BASE.origin;
test.use({ baseURL: BASE });

const SEAL_HREF = /^https:\/\/trustseal\.enamad\.ir\/\?id=7764782&Code=/;
const SEAL_IMG = /^https:\/\/trustseal\.enamad\.ir\/logo\.aspx\?id=7764782&Code=/;
// Enamad serves the seal image only to pages on the domain it was issued for, so the "image really
// loaded" check runs only against that domain (e.g. E2E_BASE_URL=https://lsevincare.com).
const ON_SEAL_DOMAIN = /(^|\.)lsevincare\.com$/.test(new URL(process.env.E2E_BASE_URL || 'http://localhost').hostname);

async function goto(page: Page, path: string) {
  for (let attempt = 1; ; attempt += 1) {
    try { await page.goto(path, { waitUntil: 'commit' }); return; } catch (error) { if (attempt >= 3) throw error; }
  }
}

async function expectSeal(
  page: Page,
  scope: ReturnType<Page['locator']>,
  href = SEAL_HREF,
  img = SEAL_IMG,
  options: { outsideDesktopFooter?: boolean } = {}
) {
  // Enamad only serves the image to the domain it was issued for (and not to every network), so
  // off that domain the bare link around it can have no size: there, check it is in the layout
  // the visitor sees (the caller's scope excludes the hidden desktop copy) instead of its pixels.
  const all = options.outsideDesktopFooter
    ? scope.locator('[data-testid="enamad-seal"]:not(footer.lsd *)')
    : scope.getByTestId('enamad-seal');
  const seal = ON_SEAL_DOMAIN ? all.filter({ visible: true }) : all;
  // The seal is chosen after hydration, and the home page may first switch language by the
  // visitor's location (a first compile of that page in dev), so allow for that.
  await expect(seal).toHaveCount(1, { timeout: 120_000 });
  await seal.scrollIntoViewIfNeeded();
  if (ON_SEAL_DOMAIN) await expect(seal).toBeVisible();
  await expect(seal).toHaveAttribute('href', href);
  await expect(seal).toHaveAttribute('referrerpolicy', 'origin');
  await expect(seal).toHaveAttribute('target', '_blank');
  await expect(seal).not.toHaveAttribute('rel', /noreferrer/);
  const image = seal.locator('img');
  await expect(image).toHaveAttribute('src', img);
  await expect(image).toHaveAttribute('referrerpolicy', 'origin');
  await expect(image).toHaveAttribute('alt', /.+/);
  // The image really loaded from Enamad (naturalWidth > 0), so the visitor sees the seal.
  if (ON_SEAL_DOMAIN) await expect.poll(() => image.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0), { timeout: 30_000 }).toBe(true);
}

test.describe('desktop (>= 1280px)', () => {
  test.use({ viewport: { width: 1366, height: 900 } });

  test('the footer shows the Enamad seal on the home page and on another page', async ({ page }) => {
    for (const path of ['/fa', '/fa/categories']) {
      await goto(page, path);
      const footer = page.locator('footer.lsd');
      await expect(footer).toBeVisible();
      await expectSeal(page, footer);
    }
  });
});

test.describe('mobile', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

  test('the home page still shows the Enamad seal', async ({ page }) => {
    await goto(page, '/fa');
    // The desktop footer is hidden at this width; the seal comes from the mobile home page.
    await expect(page.locator('footer.lsd')).toBeHidden();
    // The mobile home page's own seal, not the copy in the (hidden) desktop footer.
    await expectSeal(page, page.locator('body'), SEAL_HREF, SEAL_IMG, { outsideDesktopFooter: true });
  });
});

test.describe('a seal per domain', () => {
  test.skip(!LOCAL, 'needs the two seeded test domains of the local runner');
  test.use({ viewport: { width: 1366, height: 900 } });

  test('another domain shows its own seal, and a domain without one shows none', async ({ page }) => {
    await goto(page, `${onHost('site-b.localhost')}/fa`);
    await expectSeal(page, page.locator('footer.lsd'), /\?id=1111111&Code=TestSealForSiteB01$/, /logo\.aspx\?id=1111111&Code=TestSealForSiteB01$/);

    // Not lsevincare.com's seal on a domain that has none: Enamad would show it as invalid there.
    await goto(page, `${onHost('no-seal.localhost')}/fa`);
    await expect(page.locator('footer.lsd')).toBeVisible();
    await page.waitForLoadState('load');
    // The seal is chosen after hydration; give it the time the other domain needed, then check it stayed empty.
    await page.waitForTimeout(5_000);
    await expect(page.getByTestId('enamad-seal')).toHaveCount(0);
  });
});
