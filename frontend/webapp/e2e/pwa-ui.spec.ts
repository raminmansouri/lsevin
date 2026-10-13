import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

async function start(page: Page, path = "/en/n/app/mobile/home") {
  await page.goto(path + "?visual=1");
  await page.evaluate(async () => {
    await navigator.serviceWorker.register("/sw.js");
    await navigator.serviceWorker.ready;
  });
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  await expect(page.locator("html")).toHaveAttribute("data-hydrated", "true");
}
async function save(page: Page, path: string) {
  await page.evaluate(async (path) => {
    const module = await import(
      new URL("/fixtures/application-cache.js", location.origin).href
    );
    await module.saveApplicationPage(path, new AbortController().signal);
  }, path);
  await expect
    .poll(() =>
      page.evaluate(
        async (path) =>
          !!(await (
            await caches.open("lsevin-pwa-application-v2")
          ).match(path)),
        path
      )
    )
    .toBe(true);
}
test.beforeEach(async ({ request }) => {
  await request.get("/__fixture/session?owner=test-owner");
  await request.get("/__fixture/offline-off");
  await request.get("/__fixture/shell-failures?count=0");
});

test("bootstrap downloads stay bounded and a failed refresh preserves the previous complete page", async ({
  page,
  request,
  context,
}) => {
  await start(page);
  await request.get("/__fixture/assets?reset=1");
  const path = "/en/n/app/mobile/provider/bounded";
  await save(page, path);
  const result = await (await request.get("/__fixture/assets")).json();
  expect(result.peak).toBeLessThanOrEqual(4);
  expect(result.peak).toBeGreaterThan(1);
  await page.evaluate(async (path) => {
    const cache = await caches.open("lsevin-pwa-application-v2");
    const response = (await cache.match(path))!;
    const headers = new Headers(response.headers);
    headers.set("X-Lsevin-Saved-At", String(Date.now() - 3600000));
    await cache.put(path, new Response(await response.text(), { headers }));
  }, path);
  await request.get("/__fixture/assets?reset=1&failure=1");
  expect(
    await page.evaluate(async (path) => {
      const module = await import(
        new URL("/fixtures/application-cache.js", location.origin).href
      );
      try {
        await module.saveApplicationPage(path, new AbortController().signal);
        return false;
      } catch {
        return true;
      }
    }, path)
  ).toBe(true);
  await request.get("/__fixture/assets?reset=1&failure=html");
  expect(
    await page.evaluate(async (path) => {
      const module = await import(
        new URL("/fixtures/application-cache.js", location.origin).href
      );
      try {
        await module.saveApplicationPage(path, new AbortController().signal);
        return false;
      } catch {
        return true;
      }
    }, path)
  ).toBe(true);
  expect(
    await page.evaluate(
      async () =>
        !!(await (
          await caches.open("lsevin-pwa-assets-v2")
        ).match("/_next/static/bounded-12.js"))
    )
  ).toBe(false);
  await request.get("/__fixture/offline-on");
  await context.setOffline(true);
  await page.goto(path);
  await expect(
    page.getByRole("heading", { name: "Bounded downloads" })
  ).toBeVisible();
});

test("structured profile uses the shared React view with identical offline rendering and safe actions", async ({
  page,
  context,
  request,
}) => {
  await start(page);
  await save(page, "/en/n/app/mobile/home");
  await page.goto("/en/n/app/mobile/profile?projection=1");
  await page.evaluate(async () => {
    await import(new URL("/pwa/view-store.js", location.origin).href);
    const module = await import(
      new URL("/fixtures/profile-view.js", location.origin).href
    );
    const shell =
      "<!doctype html>" +
      module.profileDocument("test-owner", true, "/pwa/profile-projection/en")
        .outerHTML;
    await LsevinViewStore.save(
      location.pathname,
      "<!doctype html><html><body>Legacy profile view</body></html>",
      "test-owner"
    );
    const data = {
      version: 1,
      locale: "en",
      firstName: "Offline",
      lastName: "Customer",
      email: "test@example.invalid",
      image: "",
      editLabel: "Edit profile",
      signOutLabel: "Sign out",
      stats: [
        {
          label: "Bookings",
          value: "12",
          icon: "CalendarCheck2",
          href: "/n/app/mobile/bookings",
        },
        { label: "Points", value: "24", icon: "Coins" },
        { label: "Saved", value: "$30", icon: "PiggyBank" },
      ],
      menu: [
        {
          label: "Providers",
          href: "/n/app/mobile/providers",
          icon: "Heart",
          color: "text-red-600",
        },
      ],
    };
    await LsevinViewStore.save(
      "/pwa/profile-projection/en",
      JSON.stringify({ kind: "profile-v1", owner: "test-owner", shell, data }),
      "test-owner"
    );
    if (
      !(await LsevinViewStore.read(location.pathname))?.includes(
        "Legacy profile view"
      )
    )
      throw new Error("Legacy worker compatibility lost");
    for (const src of ["/pwa/live-view.js", "/pwa/profile-app.js"]) {
      const script = document.createElement("script");
      script.src = src;
      await new Promise<void>((resolve, reject) => {
        script.onload = () => resolve();
        script.onerror = reject;
        document.head.append(script);
      });
    }
  });
  await expect(
    page.getByRole("heading", { name: "Offline Customer" })
  ).toBeVisible();
  const online = await page.screenshot({ animations: "disabled" });
  const record = await page.evaluate(async () =>
    (await (
      await caches.open("lsevin-pwa-private-view-v2")
    ).match("/pwa/profile-projection/en"))!.text()
  );
  expect(record).not.toContain("Offline Customer");
  expect(record).not.toContain("test@example.invalid");
  await request.get("/__fixture/offline-on");
  await page.request.get("/__fixture/offline-on");
  await context.setOffline(true);
  await page.goto("/en/n/app/mobile/profile");
  await expect(
    page.getByRole("heading", { name: "Offline Customer" })
  ).toBeVisible();
  expect(await page.screenshot({ animations: "disabled" })).toEqual(online);
  await page.getByRole("button", { name: "Edit profile" }).click();
  await expect(page.getByRole("status")).toHaveText(
    "This action requires an internet connection."
  );
  await expect(page).toHaveURL(/\/profile$/);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Offline Customer" })
  ).toBeVisible();
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/home$/);
  expect(
    await page.evaluate(
      async () =>
        !!(await (
          await caches.open("lsevin-pwa-private-view-v2")
        ).match("/pwa/profile-projection/en"))
    )
  ).toBe(false);
});

test("nonextractable profile key, ciphertext tampering and real session invalidation fail safely", async ({
  page,
  request,
  context,
}) => {
  await start(page);
  await save(page, "/en/n/app/mobile/home");
  await page.evaluate(async () => {
    await import(new URL("/pwa/view-store.js", location.origin).href);
    await LsevinViewStore.save(
      "/en/n/app/mobile/profile",
      "PRIVATE_VIEW",
      "test-owner"
    );
  });
  expect(
    await page.evaluate(async () => {
      return await new Promise((resolve) => {
        const open = indexedDB.open("lsevin-private-view-v1", 1);
        open.onsuccess = () => {
          const db = open.result;
          const read = db.transaction("keys").objectStore("keys").get("device");
          read.onsuccess = () => {
            resolve(read.result.cryptoKey.extractable);
            db.close();
          };
        };
      });
    })
  ).toBe(false);
  await page.evaluate(() => fetch("/api/auth/session?failure=1"));
  expect(
    await page.evaluate(() => LsevinViewStore.read("/en/n/app/mobile/profile"))
  ).toBe("PRIVATE_VIEW");
  await request.get("/__fixture/session?owner=other-user");
  await page.evaluate(() => fetch("/api/auth/session", { cache: "no-store" }));
  expect(
    await page.evaluate(() => LsevinViewStore.read("/en/n/app/mobile/profile"))
  ).toBeNull();
  expect(
    await page.evaluate(async () => {
      await LsevinViewStore.save(
        "/en/n/app/mobile/profile",
        "PRIVATE_VIEW",
        "other-user"
      );
      const cache = await caches.open("lsevin-pwa-private-view-v2");
      const record = await (await cache.match(
        "/en/n/app/mobile/profile"
      ))!.json();
      record.bytes[0] ^= 1;
      await cache.put(
        "/en/n/app/mobile/profile",
        new Response(JSON.stringify(record))
      );
      try {
        await LsevinViewStore.read("/en/n/app/mobile/profile");
        return false;
      } catch {
        return true;
      }
    })
  ).toBe(true);
  await page.request.get("/__fixture/offline-on");
  await context.setOffline(true);
  await page.goto("/en/n/app/mobile/profile");
  await expect(page).toHaveURL(/\/home(?:\?offlineUnavailable=1)?$/);
  await expect(page.locator("#retry")).toHaveCount(0);
});
test.afterEach(async ({ request }) => {
  await request.get("/__fixture/offline-off");
});

test("offline pages preserve identical pixels, images, cards and functional client controls", async ({
  page,
  context,
}) => {
  const paths = [
    "/en/n/app/mobile/home",
    "/en/n/app/mobile/providers",
    "/en/n/app/mobile/provider/visual",
    "/en/n/app/mobile/service/visual",
    "/en/n/app/mobile/specialist/visual",
  ];
  await start(page);
  for (const path of paths) await save(page, path);
  await page.evaluate(() => document.fonts.ready);
  const online = await page.screenshot();
  await page.request.get("/__fixture/offline-on");
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-hydrated", "true");
  await expect(
    page.getByRole("heading", { name: "Public application" })
  ).toBeVisible();
  expect(
    (await page.screenshot()).equals(online),
    "Offline application pixels must equal the online screen"
  ).toBe(true);
  await page.getByRole("button", { name: "Services", exact: true }).click();
  await expect(page.locator("#tab-content")).toHaveText("Services and staff");
  await page.getByPlaceholder("Search").fill("Clinic Two");
  await expect(page.locator(".card:visible")).toHaveCount(1);
  await page.getByRole("link", { name: "Providers", exact: true }).click();
  await expect(page).toHaveURL(/\/providers$/);
  await page.reload();
  await expect(page.locator(".card")).toHaveCount(2);
  await page.getByRole("link", { name: "Staff", exact: true }).click();
  await expect(page).toHaveURL(/\/specialist\/visual$/);
  await page.goBack();
  await expect(page).toHaveURL(/\/providers$/);
  await page.goForward();
  await expect(page).toHaveURL(/\/specialist\/visual$/);
});

test("UI snapshots are independent guest responses and never contain signed-in markup", async ({
  page,
  context,
}) => {
  await context.addCookies([
    { name: "session", value: "private", domain: "127.0.0.1", path: "/" },
  ]);
  await start(page);
  await expect(
    page.getByRole("heading", { name: "SIGNED_IN_SECRET" })
  ).toBeVisible();
  await save(page, "/en/n/app/mobile/home");
  const html = await page.evaluate(
    async () =>
      await (await (
        await caches.open("lsevin-pwa-application-v2")
      ).match("/en/n/app/mobile/home"))!.text()
  );
  expect(html).toContain("Public application");
  expect(html).not.toContain("SIGNED_IN_SECRET");
  await page.evaluate(async () => {
    const module = await import(
      new URL("/fixtures/application-cache.js", location.origin).href
    );
    await module.saveApplicationPage(
      "/en/n/app/mobile/profile/wallet",
      new AbortController().signal
    );
  });
  expect(
    await page.evaluate(
      async () =>
        !!(await (
          await caches.open("lsevin-pwa-application-v2")
        ).match("/en/n/app/mobile/profile/wallet"))
    )
  ).toBe(false);
});

test("profile view is encrypted, retains original styling after restart, and local sign-out erases it", async ({
  page,
  context,
}) => {
  await start(page);
  await save(page, "/en/n/app/mobile/home");
  await page.evaluate(async () => {
    await import(new URL("/pwa/view-store.js", location.origin).href);
    const { profileDocument } = await import(
      new URL("/fixtures/profile-view.js", location.origin).href
    );
    document.querySelector("h1")!.textContent = "Private profile name";
    const secret = document.createElement("script");
    secret.textContent = "window.sessionToken='TOKEN_MUST_NOT_PERSIST'";
    document.body.append(secret);
    const html = "<!doctype html>" + profileDocument("test-owner").outerHTML;
    await LsevinViewStore.save("/en/n/app/mobile/profile", html, "test-owner");
  });
  const online = await page.locator("header").screenshot();
  const stored = await page.evaluate(
    async () =>
      await (await (
        await caches.open("lsevin-pwa-private-view-v2")
      ).match("/en/n/app/mobile/profile"))!.text()
  );
  expect(stored).not.toContain("Private profile name");
  expect(stored).not.toContain("TOKEN_MUST_NOT_PERSIST");
  await page.request.get("/__fixture/offline-on");
  await context.setOffline(true);
  await page.goto("/en/n/app/mobile/profile");
  await expect(
    page.getByRole("heading", { name: "Private profile name" })
  ).toBeVisible();
  expect((await page.locator("header").screenshot()).equals(online)).toBe(true);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Private profile name" })
  ).toBeVisible();
  expect(await page.evaluate(() => "sessionToken" in window)).toBe(false);
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(page).toHaveURL(/\/home(?:\?offlineUnavailable=1)?$/);
  await page.goto("/en/n/app/mobile/profile");
  await expect(
    page.getByRole("heading", { name: "Private profile name" })
  ).toHaveCount(0);
  await expect
    .poll(() =>
      page.evaluate(async () => {
        await import(new URL("/pwa/view-store.js", location.origin).href);
        return await LsevinViewStore.read("/en/n/app/mobile/profile");
      })
    )
    .toBeNull();
});

test("clearing private storage in another tab removes an already open offline profile", async ({
  page,
  context,
}) => {
  await start(page);
  await save(page, "/en/n/app/mobile/home");
  await page.evaluate(async () => {
    await import(new URL("/pwa/view-store.js", location.origin).href);
    const { profileDocument } = await import(
      new URL("/fixtures/profile-view.js", location.origin).href
    );
    document.querySelector("h1")!.textContent = "Private cross-tab profile";
    await LsevinViewStore.save(
      "/en/n/app/mobile/profile",
      "<!doctype html>" + profileDocument("test-owner").outerHTML,
      "test-owner"
    );
  });
  await page.request.get("/__fixture/offline-on");
  await context.setOffline(true);
  await page.goto("/en/n/app/mobile/profile");
  await expect(
    page.getByRole("heading", { name: "Private cross-tab profile" })
  ).toBeVisible();
  const other = await context.newPage();
  await other.goto("/en/n/app/mobile/home");
  await other.evaluate(async () => {
    await import(new URL("/pwa/view-store.js", location.origin).href);
    await LsevinViewStore.clear();
  });
  await expect(page).toHaveURL(/\/home(?:\?offlineUnavailable=1)?$/);
  await page.goto("/en/n/app/mobile/profile");
  await expect(
    page.getByRole("heading", { name: "Private cross-tab profile" })
  ).toHaveCount(0);
  await other.close();
});

test("an account change or expired private view cannot be reopened", async ({
  page,
}) => {
  await start(page);
  const result = await page.evaluate(async () => {
    await import(new URL("/pwa/view-store.js", location.origin).href);
    await LsevinViewStore.save(
      "/en/n/app/mobile/profile",
      "OLD_ACCOUNT",
      "old-owner"
    );
    await LsevinViewStore.checkOwner("new-owner");
    const changed = await LsevinViewStore.read("/en/n/app/mobile/profile");
    await LsevinViewStore.save(
      "/en/n/app/mobile/profile",
      "EXPIRED_ACCOUNT",
      "new-owner"
    );
    const cache = await caches.open("lsevin-pwa-private-view-v2");
    const record = await (await cache.match(
      "/en/n/app/mobile/profile"
    ))!.json();
    record.savedAt = Date.now() - 25 * 60 * 60 * 1000;
    await cache.put(
      "/en/n/app/mobile/profile",
      new Response(JSON.stringify(record))
    );
    const expired = await LsevinViewStore.read("/en/n/app/mobile/profile");
    return { changed, expired };
  });
  expect(result).toEqual({ changed: null, expired: null });
});

test("a disconnected origin restores the application UI rather than the reader", async ({
  page,
  request,
}) => {
  await start(page);
  await save(page, "/en/n/app/mobile/home");
  await request.get("/__fixture/offline-on");
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Public application" })
  ).toBeVisible();
  await expect(page.locator(".card")).toHaveCount(2);
  await expect(page.locator("#saved-pages")).toHaveCount(0);
  await expect(page.locator("html")).toHaveAttribute("data-hydrated", "true");
});
