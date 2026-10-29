/**
 * Regression: on phone widths several admin pages were wider than the screen (a
 * multi-language field's tab strip and wide tables stretched the form grid), which
 * pushed buttons such as "Revoke" off-screen. Every tours admin page, and the
 * destination form, must fit the viewport; wide parts scroll inside their own box.
 *
 * @regression
 */
import { expect, test, type Page, type TestInfo } from "@playwright/test";

import { seedProvider, seedTour, seedUser } from "../../src/features/tours/testing/fixtures";

import { seedBooking, signInAdmin } from "./admin-helpers";
import { closeDb, db } from "./support/db";

test.afterAll(closeDb);
test.describe.configure({ timeout: 600_000 });

const PAGES = ["", "/settings", "/taxonomy", "/destinations", "/tours", "/translations", "/editorial", "/departures", "/bookings",
  "/disputes", "/reviews", "/incidents", "/commissions", "/compliance", "/reports", "/notifications"];

async function overflow(page: Page) {
  return page.evaluate(() => {
    const cw = document.documentElement.clientWidth;
    const scrolls = (el: Element) => {
      for (let e = el.parentElement; e; e = e.parentElement) if (["auto", "scroll", "hidden"].includes(getComputedStyle(e).overflowX)) return true;
      return false;
    };
    const offenders: string[] = [];
    for (const el of Array.from(document.querySelectorAll<HTMLElement>("body *"))) {
      const r = el.getBoundingClientRect();
      if (r.right > cw + 1 && getComputedStyle(el).position !== "fixed" && !scrolls(el) && offenders.length < 3) {
        offenders.push(`${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ""}.${String(el.className).slice(0, 50)}`);
      }
    }
    return { scrollWidth: document.documentElement.scrollWidth, clientWidth: cw, offenders };
  });
}

async function evidence(page: Page, testInfo: TestInfo, scenario: string) {
  const name = `tours-admin-responsive__${scenario}__phone`;
  const file = testInfo.outputPath(`${name}.png`);
  await page.screenshot({ path: file, fullPage: false });
  await testInfo.attach(name, { path: file, contentType: "image/png" });
}

test.beforeEach(({}, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "phone width only");
});

test("every tours admin page fits a phone screen @regression", async ({ page, context }, testInfo) => {
  await signInAdmin(context);
  const failures: string[] = [];
  for (const path of PAGES) {
    await page.goto(`/fa/admin/tours-platform${path}`);
    await page.waitForLoadState("load");
    const o = await overflow(page);
    if (o.scrollWidth > o.clientWidth + 1) failures.push(`${path || "/"}: ${o.scrollWidth} > ${o.clientWidth} (${o.offenders.join(" | ")})`);
    await evidence(page, testInfo, (path || "/overview").slice(1));
  }
  expect(failures).toEqual([]);
});

test("the destination form fits a phone screen and its language tabs are usable @regression", async ({ page, context }, testInfo) => {
  await signInAdmin(context);
  await page.goto("/en/admin/tours-platform/destinations");
  await page.locator("tr[data-slug]").first().getByRole("button", { name: "Edit" }).click();
  const o = await overflow(page);
  expect(o.scrollWidth, o.offenders.join(" | ")).toBeLessThanOrEqual(o.clientWidth + 1);
  const english = page.getByTestId("dst-cover-alt").getByRole("tab", { name: /^English/ });
  await english.click();
  await expect(english).toHaveAttribute("aria-selected", "true");
  await evidence(page, testInfo, "destination-form");
});

test("a booking's support page fits a phone screen (long ids in the header are clipped) @regression", async ({ page, context }, testInfo) => {
  const sql = db();
  const owner = await seedUser(sql);
  const p = await seedProvider(sql, owner.id);
  const t = await seedTour(sql, { providerId: p.id });
  const customer = await seedUser(sql);
  const { bookingId } = await seedBooking(t, p.id, customer.id, 2);
  await signInAdmin(context);
  await page.goto(`/en/admin/tours-platform/bookings/${bookingId}`);
  await page.waitForLoadState("load");
  const o = await overflow(page);
  expect(o.scrollWidth, o.offenders.join(" | ")).toBeLessThanOrEqual(o.clientWidth + 1);
  await page.getByTestId("load-targets").click();
  await evidence(page, testInfo, "booking-support");
});
