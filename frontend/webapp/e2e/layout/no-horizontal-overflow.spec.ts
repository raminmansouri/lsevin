import { expect, test } from "@playwright/test";

/**
 * Regression (2026-11-28): on phones the service page and the clinic page were
 * wider than the screen. The related-services cards kept the price on one line
 * (whitespace-nowrap) next to the city, so a long Toman price such as
 * "۱۲۰٬۰۰۰٬۰۰۰ تومان" pushed past the card and the page scrolled sideways.
 *
 * Read-only: only opens pages. LAYOUT_BASE_URL picks the site (a local server
 * or production) and LAYOUT_PATHS (comma separated) overrides the page list.
 *   LAYOUT_BASE_URL=https://lsevincare.com npx playwright test -c playwright.layout.config.ts
 */

const PATHS = (
  process.env.LAYOUT_PATHS ||
  [
    "/fa/services/dr-kamyar-yousefi-clinic-thigh-lift",
    "/en/services/dr-kamyar-yousefi-clinic-thigh-lift",
    "/fa/providers/dr-kamyar-yousefi-clinic",
    "/fa/providers/dr-mojdeh-namdari",
    "/fa/providers",
    "/fa/services",
  ].join(",")
)
  .split(",")
  .map((path) => path.trim())
  .filter(Boolean);

for (const width of [360, 390]) {
  for (const path of PATHS) {
    test(`${path} fits a ${width}px screen`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      const response = await page.goto(path, { waitUntil: "domcontentloaded" });
      expect(response?.status(), path).toBeLessThan(400);
      await page.waitForLoadState("networkidle", { timeout: 20_000 }).catch(() => {});
      // Lazy sections (related services) render on scroll.
      for (let i = 0; i < 15; i++) {
        await page.mouse.wheel(0, 900);
        await page.waitForTimeout(200);
      }
      await page.waitForTimeout(1000);
      const result = await page.evaluate(() => {
        const vw = document.documentElement.clientWidth;
        const offenders: string[] = [];
        for (const el of Array.from(document.querySelectorAll<HTMLElement>("body *"))) {
          const box = el.getBoundingClientRect();
          if (!box.width || getComputedStyle(el).position === "fixed") continue;
          if (box.right <= vw + 1 && box.left >= -1) continue;
          let clipped = false;
          for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) {
            if (/(hidden|auto|scroll|clip)/.test(getComputedStyle(a).overflowX)) {
              clipped = true;
              break;
            }
          }
          if (!clipped) offenders.push(`${el.tagName}.${String(el.className).slice(0, 80)} "${(el.textContent || "").trim().slice(0, 30)}"`);
        }
        return { vw, sw: document.documentElement.scrollWidth, offenders: offenders.slice(0, 5) };
      });
      expect(result.sw, `${path} is ${result.sw}px wide on a ${result.vw}px screen: ${result.offenders.join(" | ")}`).toBeLessThanOrEqual(result.vw);
    });
  }
}
