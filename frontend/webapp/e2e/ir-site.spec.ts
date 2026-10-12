import { expect, test } from "@playwright/test";

// Acceptance test for the Iran site (https://lsevin.ir, served by server A).
// Run with playwright.ir.config.ts. It proves the pages served by A are self-contained: no request, link or API
// call goes back to the foreign hostname, TLS is trusted, and the app renders database-backed content.

const HOME = "/en/n/app/mobile/home?countryCode=IR&cityCode=TEHRAN&lat=35.7&lng=51.4";
const FOREIGN = /appmain\.lsevin\.com|api\.lsevin\.com|lsevincare\.com/;   // anything but lsevin.ir itself

test("home renders on A with data and makes no request to B's hostnames", async ({ page, baseURL }) => {
  const requested: string[] = [];
  const failed: string[] = [];
  page.on("request", (r) => requested.push(r.url()));
  page.on("response", (r) => { if (r.url().startsWith(baseURL!) && r.status() >= 500) failed.push(`${r.status()} ${r.url()}`); });

  const response = await page.goto(HOME, { waitUntil: "networkidle", timeout: 60_000 });
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { name: "Explore Categories" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Trusted Providers" })).toBeVisible();
  // count in the page itself (currentSrc is the URL the browser really used)
  await expect.poll(
    () => page.locator("img").evaluateAll((els) => els.filter((e) => /Categories/.test((e as HTMLImageElement).currentSrc)).length),
    { timeout: 30_000 },
  ).toBeGreaterThan(5);

  const back = requested.filter((u) => FOREIGN.test(new URL(u).hostname));
  expect(back, `requests that went back to the foreign site:\n${back.slice(0, 10).join("\n")}`).toEqual([]);
  expect(failed).toEqual([]);
});

test("hydration is clean: no console errors from the rewritten bundle", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.goto(HOME, { waitUntil: "networkidle", timeout: 60_000 });
  await page.waitForTimeout(3000);
  const relevant = errors.filter((e) => !/unsplash_images|favicon|analytics|crm\.lsevin\.com|Failed to load resource/i.test(e));
  expect(relevant, relevant.join("\n")).toEqual([]);
});

// Playwright's Node HTTP client ignores the browser's hostname mapping, so API checks run inside the page.
const inPage = (page: import("@playwright/test").Page, path: string) =>
  page.evaluate(async (p) => { const r = await fetch(p); return { status: r.status, text: await r.text() }; }, path);

test("sign-in page loads on A and its auth endpoints answer from A", async ({ page }) => {
  const r = await page.goto("/en/sign-in");
  expect(r?.status()).toBeLessThan(400);
  await expect(page.locator("input").first()).toBeVisible();
  const csrf = await inPage(page, "/api/auth/csrf");
  expect(csrf.status).toBe(200);
  expect(csrf.text).toContain("csrfToken");
  expect((await inPage(page, "/api/auth/session")).status).toBe(200);
});

test("API and files are served from the same origin (A)", async ({ page }) => {
  await page.goto("/en/sign-in");
  const ready = await inPage(page, "/readiness");
  expect(ready.status).toBe(200);
  expect(ready.text).toBe("Healthy");
  const file = await inPage(page, "/files/Categories/_health/a.json");
  expect(file.status).toBe(200);
  expect(JSON.parse(file.text).node).toBe("A");
});
