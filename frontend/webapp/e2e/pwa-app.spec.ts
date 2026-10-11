import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

async function openOnlinePage(page: Page, path: string) {
  const response = await page.goto(path, { waitUntil: "domcontentloaded" });
  expect(response?.status()).toBeLessThan(400);
  if (await page.locator("#retry").count()) {
    // A cold/slow origin may reach the worker's bounded network deadline.
    // Exercise the reader's real recovery control, without disabling fallback.
    await expect(page.locator("#status")).toHaveText(/\S/);
    await page.locator("#retry").click();
    await expect(page.locator("#retry")).toHaveCount(0);
  }
}

test("manifest, worker, offline shell and guest authentication are served correctly", async ({
  request,
}) => {
  const manifest = await request.get("/manifest.webmanifest");
  expect(manifest.status()).toBe(200);
  expect((await manifest.json()).icons).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ sizes: "192x192" }),
      expect.objectContaining({ sizes: "512x512", purpose: "maskable" }),
    ])
  );
  const worker = await request.get("/sw.js");
  expect(worker.status()).toBe(200);
  expect(worker.headers()["cache-control"]).toContain("no-store");
  expect(worker.headers()["service-worker-allowed"]).toBe("/");
  const offline = await request.get("/offline.html");
  expect(offline.status()).toBe(200);
  expect(offline.headers()["content-security-policy"]).toContain(
    "script-src 'self'"
  );
  expect((await request.get("/api/auth/session")).status()).toBe(200);
  const privatePage = await request.get("/en/n/app/mobile/profile", {
    maxRedirects: 0,
  });
  expect([302, 303, 307, 308]).toContain(privatePage.status());
  expect(privatePage.headers().location).toContain("/sign-in");
});

test("offline support starts while page images are still loading", async ({
  page,
}) => {
  let releaseImages!: () => void;
  const gate = new Promise<void>((resolve) => {
    releaseImages = resolve;
  });
  let heldImages = 0;
  await page.route("**/__pwa-e2e-held-image.png", async (route) => {
    heldImages += 1;
    await gate;
    await route.abort();
  });
  await page.addInitScript(() => {
    document.addEventListener(
      "DOMContentLoaded",
      () => {
        const image = document.createElement("img");
        image.src = "/__pwa-e2e-held-image.png";
        image.alt = "Nonessential loading fixture";
        document.body.append(image);
      },
      { once: true }
    );
  });
  try {
    const response = await page.goto("/en/n/app/mobile/home", {
      waitUntil: "domcontentloaded",
    });
    expect(response?.status()).toBeLessThan(400);
    await expect.poll(() => heldImages).toBeGreaterThan(0);
    await page.waitForFunction(
      () => !!navigator.serviceWorker?.controller,
      undefined,
      { timeout: 30000 }
    );
    expect(await page.evaluate(() => document.readyState)).toBe("interactive");
    await expect
      .poll(() =>
        page.evaluate(
          async () =>
            !!(await (
              await caches.open("lsevin-pwa-pages-v1")
            ).match(location.pathname))
        )
      )
      .toBe(true);
  } finally {
    releaseImages();
    await page.unrouteAll({ behavior: "ignoreErrors" });
  }
});

test("real landing page installs offline support and saves a reading view", async ({
  page,
  context,
}) => {
  await openOnlinePage(page, "/en/n/app/mobile/home");
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  await expect
    .poll(() =>
      page.evaluate(
        async () =>
          !!(await (
            await caches.open("lsevin-pwa-pages-v1")
          ).match(location.pathname))
      )
    )
    .toBe(true);
  await context.setOffline(true);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Saved pages", exact: true })
  ).toBeVisible();
  await expect(page.locator("details[open]")).toBeVisible();
});

test("real public catalogue pages save automatically and survive offline navigation/refresh", async ({
  page,
  context,
  request,
}) => {
  const providers = await request.get(
    "/api/booking-pro/catalog/providers?locale=enUS&take=1"
  );
  expect(providers.status()).toBe(200);
  const provider = (await providers.json()).items[0];
  expect(
    provider?.id,
    "Representative database must contain a public provider"
  ).toBeTruthy();
  const services = await request.get(
    `/api/booking-pro/catalog/services?locale=enUS&take=1&providerId=${provider.id}`
  );
  expect(services.status()).toBe(200);
  const service = (await services.json()).items[0];
  expect(
    service?.id,
    "Representative database must contain a provider service"
  ).toBeTruthy();
  const specialists = await request.get(
    `/api/booking-pro/catalog/specialists?locale=enUS&take=1&providerId=${provider.id}`
  );
  expect(specialists.status()).toBe(200);
  const specialist = (await specialists.json()).items[0];
  expect(
    specialist?.id,
    "Representative database must contain a specialist/staff member"
  ).toBeTruthy();
  const paths = [
    "/en",
    "/en/n/app/mobile/providers",
    `/en/n/app/mobile/provider/${provider.id}`,
    `/en/n/app/mobile/service/${service.id}`,
    `/en/n/app/mobile/specialist/${specialist.id}`,
  ];
  const failures: string[] = [];
  const resolvedPaths: string[] = [];
  page.on("response", (response) => {
    if (response.status() >= 500)
      failures.push(`${response.status()} ${new URL(response.url()).pathname}`);
  });
  for (const path of paths) {
    await openOnlinePage(page, path);
    await page.waitForFunction(() => !!navigator.serviceWorker.controller);
    await expect
      .poll(
        () =>
          page
            .evaluate(
              async (key) =>
                !!(await (await caches.open("lsevin-pwa-pages-v1")).match(key)),
              new URL(page.url()).pathname
            )
            .catch((error: Error) => {
              if (error.message.includes("Execution context was destroyed"))
                return false;
              throw error;
            }),
        { message: `Automatic guest snapshot missing for ${path}` }
      )
      .toBe(true);
    resolvedPaths.push(new URL(page.url()).pathname);
  }
  expect(failures).toEqual([]);
  await context.setOffline(true);
  // Production may redirect a landing entry to the locale/country home page.
  // The saved reading view belongs to that resolved page, not the redirect.
  for (const path of resolvedPaths) {
    await page.goto(path);
    await expect(page.locator("details[open]")).toBeVisible();
    await page.reload();
    await expect(page.locator("details[open]")).toBeVisible();
  }
  await page.goto("/en");
  await expect(
    page.getByRole("heading", { name: "Saved pages", exact: true })
  ).toBeVisible();
  await context.setOffline(false);
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(page.locator("#unlock-profile")).toHaveCount(0);
});

test.describe("authenticated profile", () => {
  test.skip(
    !process.env.PWA_E2E_STATE &&
      !(process.env.PWA_E2E_PHONE && process.env.PWA_E2E_OTP),
    "Supply a real test-user storage state or an active test OTP challenge."
  );
  test.use({ storageState: process.env.PWA_E2E_STATE });
  test.beforeEach(async ({ context }) => {
    if (process.env.PWA_E2E_STATE) return;
    const csrf = await context.request.get("/api/auth/csrf");
    expect(csrf.status()).toBe(200);
    const response = await context.request.post(
      "/api/auth/callback/credentials",
      {
        form: {
          csrfToken: (await csrf.json()).csrfToken,
          phoneNumber: process.env.PWA_E2E_PHONE!,
          code: process.env.PWA_E2E_OTP!,
          isOtpVerification: "true",
          callbackUrl: "/en/n/app/mobile/profile",
        },
        maxRedirects: 0,
      }
    );
    expect([200, 302, 303]).toContain(response.status());
    const session = await context.request.get("/api/auth/session");
    expect(session.status()).toBe(200);
    expect((await session.json()).user?.id).toBeTruthy();
  });
  test("save through the real profile form, unlock offline, then sign out and clear", async ({
    page,
    context,
  }) => {
    await page.goto("/en/n/app/mobile/profile");
    await page.waitForFunction(() => !!navigator.serviceWorker.controller);
    const input = page.getByLabel(
      "Offline passphrase (at least 10 characters)"
    );
    await input.fill("short");
    await page
      .getByRole("button", { name: "Save offline profile", exact: true })
      .click();
    expect(
      await input.evaluate(
        (element: HTMLInputElement) => element.validity.tooShort
      )
    ).toBe(true);
    await input.fill("E2E separate offline passphrase");
    await page
      .getByRole("button", { name: "Save offline profile", exact: true })
      .click();
    await expect(
      page.getByText(
        "Your name and email are encrypted and saved for 24 hours."
      )
    ).toBeVisible();
    const record = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("lsevin-pwa-profile-v1")!)
    );
    expect(record.ciphertext).toBeTruthy();
    expect(record.name).toBeUndefined();
    await context.setOffline(true);
    await page.reload();
    await page
      .getByLabel("Offline passphrase", { exact: true })
      .fill("E2E separate offline passphrase");
    await page.getByRole("button", { name: "Unlock saved profile" }).click();
    await expect(page.locator("#profile-content")).not.toBeEmpty();
    await context.setOffline(false);
    await page.getByRole("button", { name: "Try again" }).click();
    await expect(
      page.getByRole("button", { name: "Save offline profile", exact: true })
    ).toBeEnabled();
    await page
      .getByRole("button", { name: /log out|logout|sign out/i })
      .click();
    await expect
      .poll(() =>
        page.evaluate(() => localStorage.getItem("lsevin-pwa-profile-v1"))
      )
      .toBeNull();
  });
});
