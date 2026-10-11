import { expect, test, type Page } from "@playwright/test";

async function installed(page: Page) {
  await page.goto("/en/n/app/mobile/home");
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
}

test.beforeEach(async ({ request }) => {
  await request.get("/__fixture/offline-off");
  await request.get("/__test/version?value=1");
});

test("a disconnected origin serves saved text without browser offline emulation", async ({
  page,
  request,
}) => {
  await installed(page);
  await page.getByRole("button", { name: "Save page", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Saved", exact: true })
  ).toBeVisible();
  await request.get("/__fixture/offline-on");
  try {
    await page.reload();
    await expect(
      page.getByRole("heading", { name: "Saved pages", exact: true })
    ).toBeVisible();
    await expect(page.locator("details[open]")).toContainText(
      "Guest information about staff and services."
    );
  } finally {
    await request.get("/__fixture/offline-off");
  }
});

test("offline direct navigation, search, keyboard, refresh and reconnection", async ({
  page,
  context,
}) => {
  await installed(page);
  await page.evaluate(() =>
    fetch("/api/booking-pro/catalog/providers?locale=en")
  );
  await expect
    .poll(() =>
      page.evaluate(
        async () =>
          !!(await (
            await caches.open("lsevin-pwa-directory-v1")
          ).match("/pwa/directory/en"))
      )
    )
    .toBe(true);
  await context.setOffline(true);
  await page.goto("/en/n/app/mobile/provider/test-clinic");
  await expect(
    page.getByRole("heading", { name: "Test Clinic" })
  ).toBeVisible();
  await expect(
    page.getByText("You are offline.", { exact: false })
  ).toBeVisible();
  await page.getByRole("searchbox").fill("no-such-provider");
  await expect(page.getByText("No matching saved providers.")).toBeVisible();
  await page.getByRole("searchbox").press("ControlOrMeta+A");
  await page.getByRole("searchbox").press("Backspace");
  await expect(
    page.getByRole("heading", { name: "Test Clinic" })
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Test Clinic" })
  ).toBeVisible();
  await context.setOffline(false);
  await expect(
    page.getByText("Connection available.", { exact: false })
  ).toBeVisible();
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(
    page.getByRole("heading", { name: "Public provider information" })
  ).toBeVisible();
});

test("public snapshots save guest reading text and no scripts/forms/account data", async ({
  page,
  context,
}) => {
  await installed(page);
  await context.addCookies([
    { name: "session", value: "DO_NOT_SAVE", url: "http://127.0.0.1:4177" },
  ]);
  const guestRequest = page.waitForRequest(
    (request) =>
      request.url().endsWith("/en/n/app/mobile/home") &&
      request.resourceType() === "fetch"
  );
  await page.getByRole("button", { name: "Save page" }).click();
  expect((await guestRequest).headers().cookie).toBeUndefined();
  await expect(
    page.getByRole("button", { name: "Saved", exact: true })
  ).toBeVisible();
  const raw = await page.evaluate(async () =>
    (await (
      await caches.open("lsevin-pwa-pages-v1")
    ).match(location.pathname))!.text()
  );
  expect(raw).toContain("Guest information about staff and services.");
  expect(raw).toContain("Streamed public service details.");
  expect(raw).not.toContain("DO_NOT_SAVE");
  await context.setOffline(true);
  await page.reload();
  await expect(
    page.getByText("Guest information about staff and services.")
  ).toBeVisible();
});

test("all requested public page families survive offline refresh", async ({
  page,
  context,
}) => {
  await installed(page);
  for (const path of [
    "/en",
    "/en/n/app/mobile/providers",
    "/en/n/app/mobile/specialist/staff-one",
    "/en/n/app/mobile/service/service-one",
  ]) {
    await page.goto(path);
    await page.getByRole("button", { name: "Save page" }).click();
    await expect(
      page.getByRole("button", { name: "Saved", exact: true })
    ).toBeVisible();
  }
  await context.setOffline(true);
  for (const path of [
    "/en",
    "/en/n/app/mobile/providers",
    "/en/n/app/mobile/specialist/staff-one",
    "/en/n/app/mobile/service/service-one",
  ]) {
    await page.goto(path);
    await expect(page.locator("details[open]")).toContainText(
      "Guest information"
    );
    await page.reload();
    await expect(page.locator("details[open]")).toContainText(
      "Guest information"
    );
  }
});

test("private APIs, mutations, RSC, HTML and private static responses are not cached", async ({
  page,
}) => {
  await installed(page);
  const responses = await page.evaluate(async () => {
    await fetch("/api/private");
    await fetch("/api/private", { method: "POST", body: "test" });
    await fetch("/en/n/app/mobile/profile", { headers: { RSC: "1" } });
    await fetch("/_next/static/private.js");
    await fetch("/_next/static/public.js", {
      headers: { Authorization: "Bearer MUST_NOT_CACHE" },
    });
    await fetch("/api/booking-pro/catalog/providers?locale=en");
    return await caches.keys();
  });
  expect(responses).toContain("lsevin-pwa-shell-v1");
  await expect
    .poll(() =>
      page.evaluate(async () => {
        const directory = await (
          await caches.open("lsevin-pwa-directory-v1")
        ).match("/pwa/directory/en");
        return !!directory;
      })
    )
    .toBe(true);
  const stored = await page.evaluate(async () => {
    const records = [];
    for (const name of await caches.keys())
      for (const key of await (await caches.open(name)).keys()) {
        // Offline runtime JS contains comments about excluded fields. Only data
        // snapshots and keys are relevant to personal-data persistence.
        records.push({
          authorization: key.headers.get("authorization"),
          url: key.url,
          data: name.includes("directory")
            ? await (await (await caches.open(name)).match(key))!.text()
            : "",
        });
      }
    return records;
  });
  expect(
    stored.some(
      (record) =>
        /api\/private|profile|private\.js/.test(record.url) &&
        !record.url.endsWith("profile-crypto.js")
    )
  ).toBe(false);
  expect(JSON.stringify(stored)).not.toContain("MUST_NOT_CACHE");
  expect(JSON.stringify(stored)).not.toContain('"price"');
});

test("unsafe catalogue HTML displays as inert text and server failures remain errors", async ({
  page,
}) => {
  await installed(page);
  await page.evaluate(() =>
    fetch("/api/booking-pro/catalog/providers?locale=en")
  );
  await expect
    .poll(() =>
      page.evaluate(
        async () =>
          !!(await (
            await caches.open("lsevin-pwa-directory-v1")
          ).match("/pwa/directory/en"))
      )
    )
    .toBe(true);
  await page.goto("/offline.html");
  await expect(
    page.getByText("<img src=x onerror=alert(1)> Public description", {
      exact: true,
    })
  ).toBeVisible();
  expect(await page.locator("#directory img").count()).toBe(0);
  const result = await page.evaluate(async () => {
    const response = await fetch(
      "/api/booking-pro/catalog/providers?locale=en&fail=1"
    );
    return { status: response.status, data: await response.json() };
  });
  expect(result).toEqual({
    status: 500,
    data: { error: "InfrastructureError" },
  });
  const failure = await page.goto("/server-failure");
  expect(failure?.status()).toBe(500);
  await expect(page.getByText("Server failed")).toBeVisible();
});

test("profile unlock, incorrect passphrase, reload lock and sign-out in another tab", async ({
  page,
  context,
}) => {
  await installed(page);
  await page.evaluate(async () => {
    const cryptoUrl = "/pwa/profile-crypto.js";
    const crypto = await import(cryptoUrl);
    const record = await crypto.sealProfile(
      { name: "Test Person", email: "test@example.invalid" },
      "correct horse battery",
      "account-one"
    );
    localStorage.setItem(crypto.PROFILE_KEY, JSON.stringify(record));
  });
  await context.setOffline(true);
  await page.goto("/en/n/app/mobile/profile");
  await page
    .getByLabel("Offline passphrase", { exact: true })
    .fill("incorrect passphrase");
  await page.getByRole("button", { name: "Unlock saved profile" }).click();
  await expect(page.locator("#profile-status")).toContainText(
    "Could not unlock"
  );
  await page
    .getByLabel("Offline passphrase", { exact: true })
    .fill("correct horse battery");
  await page.getByLabel("Offline passphrase", { exact: true }).press("Enter");
  await expect(page.locator("#profile-content")).toContainText("Test Person");
  await page.reload();
  await expect(page.locator("#profile-content")).toBeEmpty();
  await page
    .getByLabel("Offline passphrase", { exact: true })
    .fill("correct horse battery");
  await page.getByRole("button", { name: "Unlock saved profile" }).click();
  await expect(page.locator("#profile-content")).toContainText("Test Person");
  const otherTab = await context.newPage();
  await otherTab.goto("/offline.html");
  await page.bringToFront();
  await page
    .getByLabel("Offline passphrase", { exact: true })
    .fill("correct horse battery");
  await page.getByRole("button", { name: "Unlock saved profile" }).click();
  await expect(page.locator("#profile-content")).toContainText("Test Person");
  await otherTab.evaluate(() =>
    localStorage.removeItem("lsevin-pwa-profile-v1")
  );
  await expect(page.locator("#profile-content")).toBeEmpty();
});

test("worker update waits for consent and preserves saved public pages", async ({
  page,
  request,
}) => {
  await installed(page);
  await page.getByRole("button", { name: "Save page" }).click();
  await expect(
    page.getByRole("button", { name: "Saved", exact: true })
  ).toBeVisible();
  await request.get("/__test/version?value=2");
  await page.evaluate(async () =>
    (await navigator.serviceWorker.getRegistration())!.update()
  );
  await expect
    .poll(() =>
      page.evaluate(
        async () =>
          (await navigator.serviceWorker.getRegistration())?.waiting?.state
      )
    )
    .toBe("installed");
  expect(await page.evaluate(() => caches.has("lsevin-pwa-shell-v1"))).toBe(
    true
  );
  await page.goto("/offline.html");
  await expect(page.locator("main")).toHaveAttribute("data-shell-version", "1");
  await page.evaluate(async () =>
    (await navigator.serviceWorker.getRegistration())!.waiting!.postMessage({
      type: "SKIP_WAITING",
    })
  );
  await expect
    .poll(() => page.evaluate(() => caches.has("lsevin-pwa-shell-v2")))
    .toBe(true);
  await expect
    .poll(() => page.evaluate(() => caches.has("lsevin-pwa-shell-v1")))
    .toBe(false);
  expect(await page.evaluate(() => caches.has("lsevin-pwa-pages-v1"))).toBe(
    true
  );
  await page.reload();
  await expect(page.locator("main")).toHaveAttribute("data-shell-version", "2");
});

test("slow document navigation falls back within the network deadline", async ({
  page,
}) => {
  await installed(page);
  const start = Date.now();
  await page.goto("/slow");
  await expect(
    page.getByRole("heading", { name: "Saved pages", exact: true })
  ).toBeVisible();
  expect(Date.now() - start).toBeLessThan(12000);
});

test("empty state, Persian RTL and clearing saved information", async ({
  page,
  context,
}) => {
  await installed(page);
  await context.setOffline(true);
  await page.goto("/fa/n/app/mobile/home");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(
    page.getByText("مرکزی ذخیره نشده است.", { exact: false })
  ).toBeVisible();
  await page.getByRole("button", { name: "English", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  await page.getByRole("button", { name: "Clear saved directory" }).click();
  await expect(
    page.getByText("No saved providers.", { exact: false })
  ).toBeVisible();
});

test("cached assets work offline, private assets fail and expired snapshots disappear", async ({
  page,
  context,
}) => {
  await installed(page);
  await page.evaluate(async () => {
    await fetch("/_next/static/offline-public.js");
    await fetch("/_next/static/offline-private.js");
    const pages = await caches.open("lsevin-pwa-pages-v1");
    await pages.put(
      "/en/n/app/mobile/service/stale",
      new Response(
        JSON.stringify({
          pathname: "/en/n/app/mobile/service/stale",
          title: "Expired service",
          text: "EXPIRED_PAGE",
          savedAt: Date.now() - 25 * 60 * 60 * 1000,
        })
      )
    );
    const directory = await caches.open("lsevin-pwa-directory-v1");
    await directory.put(
      "/pwa/directory/en",
      new Response(
        JSON.stringify({
          items: [
            {
              id: "old",
              name: "EXPIRED_PROVIDER",
              description: "",
              savedAt: Date.now() - 8 * 24 * 60 * 60 * 1000,
            },
          ],
        })
      )
    );
  });
  await expect
    .poll(() =>
      page.evaluate(
        async () =>
          !!(await (
            await caches.open("lsevin-pwa-assets-v1")
          ).match("/_next/static/offline-public.js"))
      )
    )
    .toBe(true);
  await context.setOffline(true);
  const assets = await page.evaluate(async () => {
    const cached = await (
      await fetch("/_next/static/offline-public.js")
    ).text();
    let privateFailed = false;
    try {
      await fetch("/_next/static/offline-private.js");
    } catch {
      privateFailed = true;
    }
    return { cached, privateFailed };
  });
  expect(assets.cached).toContain("pwaAssetLoaded");
  expect(assets.privateFailed).toBe(true);
  await page.goto("/en/n/app/mobile/service/stale");
  await expect(page.getByText("EXPIRED_PAGE")).toHaveCount(0);
  await expect(page.getByText("EXPIRED_PROVIDER")).toHaveCount(0);
  await expect(
    page.getByText("No saved providers.", { exact: false })
  ).toBeVisible();
});

test("profile expiry and root launch remember the last language", async ({
  page,
  context,
}) => {
  await installed(page);
  await page.evaluate(async () => {
    localStorage.setItem("lsevin-pwa-locale", "fa");
    const cryptoUrl = "/pwa/profile-crypto.js";
    const profileCrypto = await import(cryptoUrl);
    const saved = await profileCrypto.sealProfile(
      { name: "Expired Person", email: "test@example.invalid" },
      "correct horse battery",
      "account-one"
    );
    saved.savedAt = Date.now() - 25 * 60 * 60 * 1000;
    localStorage.setItem(profileCrypto.PROFILE_KEY, JSON.stringify(saved));
  });
  await context.setOffline(true);
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("lang", "fa");
  await page.goto("/en/n/app/mobile/profile");
  await page
    .getByLabel("Offline passphrase", { exact: true })
    .fill("correct horse battery");
  await page.getByRole("button", { name: "Unlock saved profile" }).click();
  await expect(page.locator("#profile-status")).toContainText(
    "Could not unlock"
  );
  await expect(page.locator("#profile-content")).toBeEmpty();
  expect(
    await page.evaluate(() => localStorage.getItem("lsevin-pwa-profile-v1"))
  ).toBeNull();
});

test("cache eviction gives a useful fallback and the shell recovers online", async ({
  page,
  context,
}) => {
  await installed(page);
  await page.evaluate(() => caches.delete("lsevin-pwa-shell-v1"));
  await context.setOffline(true);
  const response = await page.goto("/en/n/app/mobile/home");
  expect(response?.status()).toBe(503);
  await expect(
    page.getByRole("heading", { name: "Offline storage unavailable" })
  ).toBeVisible();
  await context.setOffline(false);
  await page.getByRole("link", { name: "Try again" }).click();
  await expect(
    page.getByRole("heading", { name: "Public provider information" })
  ).toBeVisible();
  await page.evaluate(() =>
    navigator.serviceWorker.controller!.postMessage({ type: "REPAIR_SHELL" })
  );
  await expect
    .poll(() =>
      page.evaluate(
        async () =>
          !!(await (
            await caches.open("lsevin-pwa-shell-v1")
          ).match("/offline.html"))
      )
    )
    .toBe(true);
  await context.setOffline(true);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Saved pages", exact: true })
  ).toBeVisible();
});

test("storage read/write failures do not break successful online asset requests", async ({
  page,
  context,
}) => {
  await installed(page);
  const worker = context.serviceWorkers()[0];
  // Incognito Chrome does not reliably enforce CDP quota overrides. Inject
  // deterministic browser storage errors into the actual worker's realm; the
  // network and all other CacheStorage behavior remain real.
  await worker.evaluate(() => {
    (self as unknown as { pwaWriteFailures: number }).pwaWriteFailures = 0;
    Cache.prototype.put = async () => {
      (self as unknown as { pwaWriteFailures: number }).pwaWriteFailures += 1;
      throw new DOMException("Full", "QuotaExceededError");
    };
  });
  const result = await page.evaluate(async () => {
    const response = await fetch("/_next/static/quota.js");
    return { status: response.status, text: await response.text() };
  });
  expect(result.status).toBe(200);
  expect(result.text).toContain("pwaAssetLoaded");
  await expect
    .poll(() =>
      worker.evaluate(
        () => (self as unknown as { pwaWriteFailures: number }).pwaWriteFailures
      )
    )
    .toBeGreaterThan(0);
  expect(
    await page.evaluate(
      async () =>
        !!(await caches.match("/_next/static/quota.js", {
          cacheName: "lsevin-pwa-assets-v1",
        }))
    )
  ).toBe(false);
  await worker.evaluate(() => {
    CacheStorage.prototype.open = async () => {
      throw new DOMException("Storage disabled", "SecurityError");
    };
  });
  const unavailable = await page.evaluate(async () => {
    const response = await fetch("/_next/static/unavailable.js");
    return { status: response.status, text: await response.text() };
  });
  expect(unavailable.status).toBe(200);
  expect(unavailable.text).toContain("pwaAssetLoaded");
});

test("slow guest streams save marked partial text and cancelled navigations do not write", async ({
  page,
  context,
}) => {
  await installed(page);
  const results = await page.evaluate(async () => {
    const moduleUrl = "/fixtures/public-snapshot.js";
    const { savePublicPage } = await import(moduleUrl);
    const deadline = new AbortController();
    const timer = setTimeout(
      () => deadline.abort(new DOMException("Deadline", "TimeoutError")),
      250
    );
    await savePublicPage(
      "/en/n/app/mobile/provider/slow-prefix",
      deadline.signal
    );
    clearTimeout(timer);
    const cancelled = new AbortController();
    const cancelTimer = setTimeout(() => cancelled.abort(), 250);
    await savePublicPage(
      "/en/n/app/mobile/provider/cancel-prefix",
      cancelled.signal
    );
    clearTimeout(cancelTimer);
    const cache = await caches.open("lsevin-pwa-pages-v1");
    return {
      snapshot: await (await cache.match(
        "/en/n/app/mobile/provider/slow-prefix"
      ))!.json(),
      cancelledStored: !!(await cache.match(
        "/en/n/app/mobile/provider/cancel-prefix"
      )),
      executed: !!(window as unknown as { snapshotExecuted?: boolean })
        .snapshotExecuted,
    };
  });
  expect(results.snapshot.partial).toBe(true);
  expect(results.snapshot.text).toContain(
    "Already available guest information."
  );
  expect(JSON.stringify(results.snapshot)).not.toContain("MUST_NOT_SAVE");
  expect(results.cancelledStored).toBe(false);
  expect(results.executed).toBe(false);
  await context.setOffline(true);
  await page.goto("/en/n/app/mobile/provider/slow-prefix");
  await expect(
    page.getByText("Partial page saved. Reconnect to see all content.")
  ).toBeVisible();
  await expect(
    page.getByText("Already available guest information.")
  ).toBeVisible();
});

test("offline payment callbacks, APIs and downloads are not disguised as HTML pages", async ({
  page,
  context,
}) => {
  await installed(page);
  await context.setOffline(true);
  for (const path of [
    "/api/private",
    "/en/api/payments/gateway/callback",
    "/files/private-report.pdf",
  ]) {
    await expect(page.goto(path)).rejects.toThrow();
    await expect(
      page.getByRole("heading", { name: "Saved pages", exact: true })
    ).toHaveCount(0);
  }
});
