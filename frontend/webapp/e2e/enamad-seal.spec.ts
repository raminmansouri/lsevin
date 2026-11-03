import { expect, test, type Page } from '@playwright/test';

/**
 * The Enamad trust seal must be visible on both layouts of the public site: the desktop footer
 * (>= 1280px, every customer page) and the mobile home page. Enamad verifies the seal from the page
 * that shows it, so the link and image keep referrerPolicy "origin" and the image is loaded straight
 * from trustseal.enamad.ir (not through our image optimizer).
 *
 * Run through `pnpm test:local-env --suite site-chrome`, or against a deployed site with
 * E2E_BASE_URL=https://lsevincare.com npx playwright test --config playwright.site-chrome.config.ts
 */

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

async function expectSeal(page: Page, scope: ReturnType<Page['locator']>) {
  // Only the visible one: at phone width the desktop footer is still in the page, just hidden.
  const seal = scope.getByTestId('enamad-seal').filter({ visible: true });
  await expect(seal).toHaveCount(1);
  await seal.scrollIntoViewIfNeeded();
  await expect(seal).toBeVisible();
  await expect(seal).toHaveAttribute('href', SEAL_HREF);
  await expect(seal).toHaveAttribute('referrerpolicy', 'origin');
  await expect(seal).toHaveAttribute('target', '_blank');
  await expect(seal).not.toHaveAttribute('rel', /noreferrer/);
  const image = seal.locator('img');
  await expect(image).toHaveAttribute('src', SEAL_IMG);
  await expect(image).toHaveAttribute('referrerpolicy', 'origin');
  await expect(image).toHaveAttribute('alt', /.+/);
  // The image really loaded from Enamad (naturalWidth > 0), so the visitor sees the seal.
  if (ON_SEAL_DOMAIN) await expect.poll(() => image.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0), { timeout: 30_000 }).toBe(true);
}

test.describe('desktop (>= 1280px)', () => {
  test.use({ viewport: { width: 1366, height: 900 } });

  test('the footer shows the Enamad seal on the home page and on another page', async ({ page }) => {
    for (const path of ['/fa/n/app/mobile/home', '/fa/n/app/mobile/categories']) {
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
    await goto(page, '/fa/n/app/mobile/home');
    // The desktop footer is hidden at this width; the seal comes from the mobile home page.
    await expect(page.locator('footer.lsd')).toBeHidden();
    await expectSeal(page, page.locator('body'));
  });
});
