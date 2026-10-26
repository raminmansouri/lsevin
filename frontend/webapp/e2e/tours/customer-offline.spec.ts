/**
 * AT-29 Offline voucher (C-040, S-040): a voucher opened once is available
 * without network — reloading offline shows the saved code, time and meeting
 * point, clearly labelled as offline.
 */
import { expect, test } from "@playwright/test";

import { bookUrl, fillAndConfirm, seedCatalog, signedInCustomer, skipIntro } from "./customer-helpers";
import { closeDb } from "./support/db";

test.afterAll(closeDb);
// First hits compile routes on the dev server (Turbopack can take minutes).
test.describe.configure({ timeout: 360_000 });

test("saved voucher and meeting point are shown offline", async ({ page, context }) => {
  const c = await seedCatalog([{ adultPrice: 0, childPrice: 0, firstDepartureInDays: 5 }]);
  await signedInCustomer(context);
  await skipIntro(context);
  await page.goto(bookUrl("en", c.tours[0].slug, c.tours[0].departureIds[0]));
  await fillAndConfirm(page);
  await page.getByTestId("view-voucher").click();
  await expect(page.getByTestId("voucher")).toHaveAttribute("data-status", "confirmed");
  const code = (await page.getByTestId("voucher-code").innerText()).trim();
  const voucherUrl = page.url();
  const bookingId = voucherUrl.split("/").pop()!;

  // The page saved its offline copy and the Tours service worker controls the page.
  await expect
    .poll(async () => page.evaluate(async (id) => Boolean(await caches.match(`/__tours_offline/voucher/${id}`)), bookingId), { timeout: 20_000 })
    .toBe(true);
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => true));
  await page.reload();
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller)), { timeout: 20_000 }).toBe(true);

  // Playwright's setOffline does not cover requests made by a service worker, so the
  // worker's own network is cut through CDP as well (Chromium) — a real offline device.
  await context.setOffline(true);
  const cdp = await page.context().browser()!.newBrowserCDPSession();
  const { targetInfos } = (await cdp.send("Target.getTargets")) as { targetInfos: { targetId: string; type: string; url: string }[] };
  const sw = targetInfos.find((t) => t.type === "service_worker" && t.url.includes("/api/tours/sw"));
  expect(sw, "tours service worker target").toBeTruthy();
  const { sessionId } = (await cdp.send("Target.attachToTarget", { targetId: sw!.targetId, flatten: false })) as { sessionId: string };
  let id = 1;
  const toWorker = (method: string, params: Record<string, unknown> = {}) =>
    cdp.send("Target.sendMessageToTarget", { sessionId, message: JSON.stringify({ id: id++, method, params }) });
  await toWorker("Network.enable");
  await toWorker("Network.emulateNetworkConditions", { offline: true, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
  await page.reload();
  const offline = page.getByTestId("offline-voucher");
  await expect(offline).toBeVisible();
  await expect(page.getByTestId("offline-banner")).toContainText("offline");
  await expect(offline).toContainText(code);
  await expect(page.getByTestId("offline-meeting")).toContainText("Eram Square");
  await expect(page.locator("svg[role=img]")).toBeVisible();
  await context.setOffline(false);
});
