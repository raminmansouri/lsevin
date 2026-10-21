import { expect, test, type Page } from "@playwright/test";

async function installed(page: Page) {
  await page.goto("/en/n/app/mobile/home");
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
}

test.beforeEach(async ({ request }) => {
  await request.get("/__fixture/offline-off");
  await request.get("/__fixture/shell-failures?count=0");
  await request.get("/__test/version?value=1");
});

test("transient setup failure retries the atomic offline shell installation", async ({
  page,
  request,
}) => {
  await request.get("/__fixture/shell-failures?count=1");
  await installed(page);
  expect(
    await page.evaluate(async () => {
      const names = await caches.keys();
      const shell = await caches.open(
        names.find((name) => name.startsWith("lsevin-pwa-shell-"))!
      );
      return (
        !!(await shell.match("/offline.html")) &&
        !!(await shell.match("/pwa/offline.js")) &&
        !!(await shell.match("/pwa/profile-crypto.js"))
      );
    })
  ).toBe(true);
  // CDN entries for unversioned URLs may still contain the retired reader.
  // The normalized offline key must contain a response fetched for this release.
  expect(
    await page.evaluate(async () => {
      const names = await caches.keys();
      const shell = await caches.open(
        names.find((name) => name.startsWith("lsevin-pwa-shell-"))!
      );
      return (await shell.match("/offline.html"))!.url;
    })
  ).toMatch(/\?pwa=/);
  await request.get("/__fixture/offline-on");
  try {
    await page.reload();
    await expect(
      page.getByRole("heading", { name: "Connection unavailable", exact: true })
    ).toBeVisible();
    await expect
      .poll(() =>
        page
          .locator('img[alt="LSevin"]')
          .evaluate((img: HTMLImageElement) => img.naturalWidth)
      )
      .toBeGreaterThan(0);
  } finally {
    await request.get("/__fixture/offline-off");
  }
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
      page.getByRole("heading", { name: "Connection unavailable", exact: true })
    ).toBeVisible();
    await expect(page.locator("article, details, input, form")).toHaveCount(0);
  } finally {
    await request.get("/__fixture/offline-off");
  }
});

test("HTTP-cached document cannot replace the offline reader", async ({
  page,
  request,
}) => {
  await installed(page);
  const path = "/en/n/app/mobile/specialist/http-cached";
  // Warm the browser HTTP cache separately from the worker's CacheStorage.
  await page.evaluate((path) => fetch(path, { cache: "reload" }), path);
  await request.get("/__fixture/offline-on");
  try {
    await page.goto(path);
    await expect(
      page.getByRole("heading", { name: "Connection unavailable", exact: true })
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Save page" })).toHaveCount(
      0
    );
    await page.reload();
    await expect(
      page.getByRole("heading", { name: "Connection unavailable", exact: true })
    ).toBeVisible();
  } finally {
    await request.get("/__fixture/offline-off");
  }
});

test("document 5xx responses use the reader without changing origin API status", async ({
  page,
  request,
}) => {
  await installed(page);
  for (const [path, status] of [
    ["/en/n/app/mobile/provider/server-error", 500],
    ["/en/n/app/mobile/provider/gateway-error", 503],
  ] as const) {
    expect((await request.get(path)).status()).toBe(status);
    await page.goto(path);
    await expect(
      page.getByRole("heading", { name: "Connection unavailable", exact: true })
    ).toBeVisible();
    expect(await page.evaluate(() => navigator.onLine)).toBe(true);
    await page.reload();
    await expect(page.locator("#retry")).toBeVisible();
  }
  expect(
    (await request.get("/api/booking-pro/catalog/providers?fail=1")).status()
  ).toBe(500);
});

test("document permission and not-found failures keep their real status", async ({
  page,
}) => {
  await installed(page);
  for (const [path, status] of [
    ["/en/n/app/mobile/provider/forbidden", 403],
    ["/en/n/app/mobile/provider/not-found", 404],
  ] as const) {
    const response = await page.goto(path);
    expect(response?.status()).toBe(status);
    await expect(
      page.getByRole("heading", {
        name: `Origin status ${status}`,
        exact: true,
      })
    ).toBeVisible();
    await expect(page.locator("#retry")).toHaveCount(0);
  }
});

test("fallback retry supports keyboard recovery without a saved-directory screen", async ({
  page,
  context,
}) => {
  await installed(page);
  await page.request.get("/__fixture/offline-on");
  await context.setOffline(true);
  await page.goto("/en/n/app/mobile/provider/test-clinic");
  await expect(
    page.getByRole("heading", { name: "Connection unavailable", exact: true })
  ).toBeVisible();
  await expect(page.locator("input, article, details, form")).toHaveCount(0);
  await page.reload();
  await expect(page.locator("#retry")).toBeVisible();
  await context.setOffline(false);
  await page.request.get("/__fixture/offline-off");
  await page.locator("#retry").focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("button", { name: "Save page", exact: true })
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
  await page.request.get("/__fixture/offline-on");
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator("#title")).toHaveText("Connection unavailable");
  await expect(page.locator("details, article")).toHaveCount(0);
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
  await page.request.get("/__fixture/offline-on");
  await context.setOffline(true);
  for (const path of [
    "/en",
    "/en/n/app/mobile/providers",
    "/en/n/app/mobile/specialist/staff-one",
    "/en/n/app/mobile/service/service-one",
  ]) {
    await page.goto(path);
    await expect(
      page.getByRole("heading", { name: "Connection unavailable", exact: true })
    ).toBeVisible();
    await expect(page.locator("details, article")).toHaveCount(0);
    await page.reload();
    await expect(
      page.getByRole("heading", { name: "Connection unavailable", exact: true })
    ).toBeVisible();
    await expect(page.locator("details, article")).toHaveCount(0);
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
    stored.filter(
      (record) =>
        /api\/private|profile|private\.js/.test(record.url) &&
        !record.url.endsWith("profile-crypto.js") &&
        !record.url.endsWith("/pwa/profile-app.js")
    )
  ).toEqual([]);
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
  await expect(page.locator("article, details, input, form")).toHaveCount(0);
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

test("fallback never exposes legacy saved profile data or an unlock form", async ({
  page,
  context,
}) => {
  await installed(page);
  await page.evaluate(() =>
    localStorage.setItem("lsevin-offline-profile", "PRIVATE_LEGACY_SENTINEL")
  );
  await page.request.get("/__fixture/offline-on");
  await context.setOffline(true);
  await page.goto("/en/n/app/mobile/profile");
  await expect(
    page.getByRole("heading", { name: "Connection unavailable", exact: true })
  ).toBeVisible();
  await expect(page.locator("input, form, article, details")).toHaveCount(0);
  await expect(page.locator("body")).not.toContainText(
    "PRIVATE_LEGACY_SENTINEL"
  );
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
    page.getByRole("heading", { name: "Connection unavailable", exact: true })
  ).toBeVisible();
  expect(Date.now() - start).toBeLessThan(12000);
});

test("uncached Persian page uses branded RTL fallback and retry preserves its URL", async ({
  page,
  context,
}) => {
  await installed(page);
  await page.request.get("/__fixture/offline-on");
  await context.setOffline(true);
  const target = "/fa/n/app/mobile/provider/not-saved?tab=services";
  await page.goto(target);
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.locator("#title")).toHaveText("اتصال برقرار نیست");
  await expect(page.getByRole("img", { name: "LSevin" })).toBeVisible();
  await expect(page.locator("article, details, input, form")).toHaveCount(0);
  await page.getByRole("button", { name: "تلاش دوباره" }).click();
  await expect(page).toHaveURL(
    new RegExp("/fa/n/app/mobile/provider/not-saved\\?tab=services$")
  );
  await context.setOffline(false);
  await page.request.get("/__fixture/offline-off");
  await page.getByRole("button", { name: "تلاش دوباره" }).click();
  await expect(
    page.getByRole("button", { name: "Save page", exact: true })
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
            await caches.open("lsevin-pwa-assets-v2")
          ).match("/_next/static/offline-public.js"))
      )
    )
    .toBe(true);
  await page.request.get("/__fixture/offline-on");
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
  await expect(page.locator("#title")).toHaveText("Connection unavailable");
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
  await page.request.get("/__fixture/offline-on");
  await context.setOffline(true);
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("lang", "fa");
  await page.goto("/en/n/app/mobile/profile");
  await expect(page.locator("form, input")).toHaveCount(0);
  await expect(page.locator("body")).not.toContainText("Expired Person");
  await expect(page.locator("#title")).toHaveText("Connection unavailable");
});

test("cache eviction gives a useful fallback and the shell recovers online", async ({
  page,
  context,
}) => {
  await installed(page);
  await page.evaluate(() => caches.delete("lsevin-pwa-shell-v1"));
  await page.request.get("/__fixture/offline-on");
  await context.setOffline(true);
  const response = await page.goto("/en/n/app/mobile/home");
  expect(response?.status()).toBe(503);
  await expect(
    page.getByRole("heading", { name: "Offline storage unavailable" })
  ).toBeVisible();
  await page.request.get("/__fixture/offline-off");
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
  await page.request.get("/__fixture/offline-on");
  await context.setOffline(true);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Connection unavailable", exact: true })
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
          cacheName: "lsevin-pwa-assets-v2",
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
  await page.request.get("/__fixture/offline-on");
  await context.setOffline(true);
  await page.goto("/en/n/app/mobile/provider/slow-prefix");
  await expect(page.locator("#title")).toHaveText("Connection unavailable");
  await expect(page.locator("details, article")).toHaveCount(0);
});

test("offline payment callbacks, APIs and downloads are not disguised as HTML pages", async ({
  page,
  context,
}) => {
  await installed(page);
  await page.request.get("/__fixture/offline-on");
  await context.setOffline(true);
  for (const path of [
    "/api/private",
    "/en/api/payments/gateway/callback",
    "/files/private-report.pdf",
  ]) {
    await expect(page.goto(path)).rejects.toThrow();
    await expect(
      page.getByRole("heading", { name: "Connection unavailable", exact: true })
    ).toHaveCount(0);
  }
});
