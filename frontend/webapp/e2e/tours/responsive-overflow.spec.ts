/**
 * Regression: on 360px phones /tours/explore was wider than the screen (the
 * sort select + list/map toggle forced the toolbar row past the viewport, so
 * the whole app scrolled sideways). Every customer Tours page must fit phone
 * widths in RTL and LTR, the intro must show its photograph with a credit, and
 * the 0083 showcase tours must render — without console errors or failed
 * requests. Screenshots of each passing page are attached to the report.
 *
 * @regression @critical
 */
import { expect, test, type Page, type TestInfo } from "@playwright/test";

import { signedInCustomer, skipIntro } from "./customer-helpers";
import { closeDb } from "./support/db";

test.afterAll(closeDb);
test.describe.configure({ timeout: 600_000 });

const WIDTHS = [320, 360, 390];
const LOCALES = ["fa", "en"];
const SHOWCASE = "persepolis-naqsh-e-rustam-day-trip";
const PAGES = [
  "/tours",
  "/tours/explore",
  "/tours/explore?sort=rating",
  "/tours/explore?view=map",
  "/tours/destinations",
  "/tours/destinations/shiraz",
  `/tours/t/${SHOWCASE}`,
  `/tours/t/${SHOWCASE}/book`,
  "/tours/bookings",
  "/tours/wishlist",
  "/tours/profile",
];

/**
 * Pre-existing parent-app defect, not Tours: the Lsevin home hero and clinic pages reference
 * /unsplash_images/*.jpg, which is gitignored and 404s in production too. The Tours "Back to Lsevin"
 * link prefetches that page. Ignore exactly that path; every other error still fails the test.
 */
const KNOWN_UNRELATED = /\/unsplash_images\//;

/** Collects console errors and failed same-origin requests while `run` executes. */
async function watchErrors(page: Page, run: () => Promise<void>) {
  const errors: string[] = [];
  const push = (e: string) => {
    if (!KNOWN_UNRELATED.test(e)) errors.push(e);
  };
  const onConsole = (m: import("@playwright/test").ConsoleMessage) => {
    if (m.type() !== "error" || /Download the React DevTools|\[HMR\]|\[Fast Refresh\]/.test(m.text())) return;
    // Third-party embeds of the parent app (e.g. the Enamad trust seal) are outside Tours' control.
    const source = m.location().url;
    if (source && new URL(source).origin !== new URL(page.url()).origin) return;
    push(`console: ${m.text()} @ ${source}`);
  };
  const onFailed = (r: import("@playwright/test").Request) => {
    const failure = r.failure()?.errorText ?? "";
    // Navigations away abort in-flight RSC/prefetch requests; that is not a failure.
    if (/ERR_ABORTED|NS_BINDING_ABORTED/.test(failure)) return;
    if (new URL(r.url()).origin === new URL(page.url()).origin) push(`request: ${r.url()} ${failure}`);
  };
  const onResponse = (r: import("@playwright/test").Response) => {
    if (r.status() >= 400 && new URL(r.url()).origin === new URL(page.url()).origin) push(`HTTP ${r.status()}: ${r.url()}`);
  };
  page.on("console", onConsole);
  page.on("requestfailed", onFailed);
  page.on("response", onResponse);
  try {
    await run();
  } finally {
    page.off("console", onConsole);
    page.off("requestfailed", onFailed);
    page.off("response", onResponse);
  }
  return errors;
}

async function horizontalOverflow(page: Page) {
  return page.evaluate(() => {
    const doc = document.documentElement;
    const offenders: string[] = [];
    if (doc.scrollWidth > doc.clientWidth + 1) {
      for (const el of Array.from(document.querySelectorAll<HTMLElement>("body *"))) {
        const r = el.getBoundingClientRect();
        if (r.width > 0 && (r.right > doc.clientWidth + 1 || r.left < -1) && getComputedStyle(el).position !== "fixed") {
          offenders.push(`${el.tagName.toLowerCase()}${el.dataset.testid ? `[${el.dataset.testid}]` : ""}.${String(el.className).slice(0, 60)}`);
          if (offenders.length >= 5) break;
        }
      }
    }
    return { scrollWidth: doc.scrollWidth, clientWidth: doc.clientWidth, offenders };
  });
}

/** Success evidence per CLAUDE.md §3.1: `<feature>__<scenario>__<step>.png`, attached to the HTML report. */
async function evidence(page: Page, testInfo: TestInfo, scenario: string, step: string) {
  const name = `tours-responsive__${scenario}__${step}`;
  const file = testInfo.outputPath(`${name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  await testInfo.attach(name, { path: file, contentType: "image/png" });
}

test.beforeEach(({}, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "phone widths are set per test; one project is enough");
});

test("intro shows the licensed photograph with a credit and fits phone widths @regression @critical", async ({ page }, testInfo) => {
  for (const locale of LOCALES) {
    for (const width of WIDTHS) {
      await page.setViewportSize({ width, height: 780 });
      const errors = await watchErrors(page, async () => {
        await page.goto(`/${locale}/tours/intro`);
        await expect(page.getByTestId("tours-intro")).toBeVisible();
        const bg = page.getByTestId("tours-intro-background");
        await expect(bg).toBeVisible();
        await expect.poll(() => bg.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
        await expect(page.getByTestId("tours-intro-credit")).toContainText("CC BY-SA 4.0");
        await expect(page.getByTestId("intro-continue")).toBeInViewport();
      });
      expect(errors, `${locale} ${width}px`).toEqual([]);
      const o = await horizontalOverflow(page);
      expect(o.scrollWidth, `${locale} intro @${width}px: ${o.offenders.join(" | ")}`).toBeLessThanOrEqual(o.clientWidth + 1);
      if (width === 360) await evidence(page, testInfo, `intro-${locale}`, `${width}px`);
    }
  }
});

for (const locale of LOCALES) {
  for (const path of PAGES) {
    test(`${locale}${path} fits 320/360/390px without errors @regression @critical`, async ({ page, context }, testInfo) => {
      await skipIntro(context);
      await signedInCustomer(context);
      const failures: string[] = [];
      for (const width of WIDTHS) {
        await page.setViewportSize({ width, height: 780 });
        const errors = await watchErrors(page, async () => {
          const res = await page.goto(`/${locale}${path}`);
          expect(res?.status(), `${locale}${path}`).toBeLessThan(400);
          await page.locator("[data-testid=tours-shell]").first().waitFor();
          await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => undefined);
        });
        const o = await horizontalOverflow(page);
        if (o.scrollWidth > o.clientWidth + 1) failures.push(`@${width}px: scrollWidth ${o.scrollWidth} > ${o.clientWidth} (${o.offenders.join(" | ")})`);
        for (const e of errors) failures.push(`@${width}px: ${e}`);
        if (width === 360) await evidence(page, testInfo, `${locale}${path.replace(/[/?=]+/g, "-")}`, `${width}px`);
      }
      expect(failures).toEqual([]);
    });
  }
}

test("showcase tours from migration 0083 are listed with photos and open in both languages @regression", async ({ page, context }, testInfo) => {
  await skipIntro(context);
  await page.setViewportSize({ width: 390, height: 844 });
  // The shared e2e database also holds many fixture destinations, so open each seeded one directly.
  for (const [slug, name] of [["shiraz", "Shiraz"], ["isfahan", "Isfahan"], ["yazd", "Yazd"], ["kish", "Kish Island"]]) {
    await page.goto(`/en/tours/destinations/${slug}`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(name);
    await expect(page.locator("a[href*='/tours/t/']").first()).toBeVisible();
  }
  await evidence(page, testInfo, "showcase-en", "01-destination-kish");

  await page.goto(`/en/tours/t/${SHOWCASE}`);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Persepolis & Naqsh-e Rustam day trip");
  const hero = page.locator("img[src*='/images/tours/shiraz-persepolis']").first();
  await expect(hero).toBeVisible();
  await expect.poll(() => hero.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);
  await evidence(page, testInfo, "showcase-en", "02-tour-detail");

  await page.goto(`/fa/tours/t/${SHOWCASE}`);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("تخت جمشید و نقش رستم در یک روز");
  await page.reload();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("تخت جمشید و نقش رستم در یک روز");
  await evidence(page, testInfo, "showcase-fa", "03-tour-detail-after-reload");
});
