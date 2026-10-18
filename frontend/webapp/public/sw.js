// Public guest documents retain the real application UI. Private profile DOM
// is encrypted separately; session/RSC/account APIs and mutations stay online.
/* PROFILE_VIEW_STORE_START */
// Shared by the worker and the signed-in client. No session tokens are stored.
(() => {
  const DB = "lsevin-private-view-v1";
  const CACHE = "lsevin-pwa-private-view-v2";
  const ttl = 24 * 60 * 60 * 1000;
  async function database() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB, 1);
      request.onupgradeneeded = () => request.result.createObjectStore("keys");
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  async function key(create = false, owner) {
    const candidate = create
      ? await crypto.subtle.generateKey(
          { name: "AES-GCM", length: 256 },
          false,
          ["encrypt", "decrypt"]
        )
      : null;
    const db = await database();
    try {
      return await new Promise((resolve, reject) => {
        const tx = db.transaction("keys", create ? "readwrite" : "readonly");
        const store = tx.objectStore("keys");
        let value;
        const get = store.get("device");
        get.onsuccess = () => {
          value =
            get.result || (candidate ? { cryptoKey: candidate, owner } : null);
          if (!get.result && value) store.put(value, "device");
        };
        tx.oncomplete = () => {
          if (value && value.owner !== owner)
            reject(new Error("AccountChanged"));
          else resolve(value?.cryptoKey || null);
        };
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error);
      });
    } finally {
      db.close();
    }
  }
  async function clear() {
    const db = await database();
    try {
      await new Promise((resolve, reject) => {
        const tx = db.transaction("keys", "readwrite");
        tx.objectStore("keys").clear();
        tx.oncomplete = resolve;
        tx.onerror = () => reject(tx.error);
      });
      await caches.delete(CACHE);
      if (typeof globalThis.clients?.matchAll === "function") {
        for (const client of await globalThis.clients.matchAll({
          type: "window",
          includeUncontrolled: true,
        }))
          client.postMessage({ type: "PRIVATE_VIEW_CLEARED" });
      } else
        globalThis.navigator?.serviceWorker?.controller?.postMessage({
          type: "PRIVATE_VIEW_CLEARED",
        });
    } finally {
      db.close();
    }
  }
  async function save(path, html, owner) {
    const deviceKey = await key(true, owner);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const savedAt = Date.now();
    const ciphertext = await crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv,
        additionalData: new TextEncoder().encode(
          JSON.stringify([owner, savedAt])
        ),
      },
      deviceKey,
      new TextEncoder().encode(html)
    );
    const record = {
      owner,
      savedAt,
      version: 2,
      iv: Array.from(iv),
      bytes: Array.from(new Uint8Array(ciphertext)),
    };
    await (
      await caches.open(CACHE)
    ).put(
      path,
      new Response(JSON.stringify(record), {
        headers: { "Content-Type": "application/json" },
      })
    );
  }
  async function read(path) {
    const response = await (await caches.open(CACHE)).match(path);
    if (!response) return null;
    const record = await response.json();
    if (Date.now() - record.savedAt > ttl) {
      await clear();
      return null;
    }
    const deviceKey = await key(false, record.owner);
    if (!deviceKey) return null;
    const plaintext = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: new Uint8Array(record.iv),
        additionalData: new TextEncoder().encode(
          record.version === 2
            ? JSON.stringify([record.owner, record.savedAt])
            : record.owner
        ),
      },
      deviceKey,
      new Uint8Array(record.bytes)
    );
    let value = new TextDecoder().decode(plaintext);
    if (
      path.endsWith("/profile") &&
      !value.includes("data-lsevin-view-owner=")
    ) {
      const owner = record.owner.replace(
        /[&"<>]/g,
        (char) =>
          ({ "&": "&amp;", '"': "&quot;", "<": "&lt;", ">": "&gt;" })[char]
      );
      value = value.replace(
        /<html\b/,
        `<html data-lsevin-view-owner="${owner}" data-lsevin-view-until="${record.savedAt + ttl}"`
      );
    }
    return value;
  }
  async function checkOwner(owner) {
    try {
      await key(false, owner);
    } catch {
      await clear();
      return;
    }
    const cache = await caches.open(CACHE);
    for (const request of await cache.keys()) {
      const record = await (await cache.match(request)).json();
      if (record.owner !== owner) {
        await clear();
        return;
      }
    }
  }
  async function validOwner(path, owner) {
    const response = await (await caches.open(CACHE)).match(path);
    if (!response) return false;
    const record = await response.json();
    if (record.owner !== owner || Date.now() - record.savedAt > ttl)
      return false;
    try {
      return !!(await key(false, owner));
    } catch {
      return false;
    }
  }
  globalThis.LsevinViewStore = { save, read, clear, checkOwner, validOwner };
})();

/* PROFILE_VIEW_STORE_END */
const VERSION = "v1-6aefbd16afefc190";
const SHELL_CACHE = `lsevin-pwa-shell-${VERSION}`;
const ASSET_CACHE = "lsevin-pwa-assets-v2";
const APPLICATION_CACHE = "lsevin-pwa-application-v2";
const DIRECTORY_CACHE = "lsevin-pwa-directory-v1";
const SHELL = [
  "/offline.html",
  "/pwa/offline.js",
  "/pwa/view-store.js",
  "/pwa/live-view.js",
  "/pwa/profile-app.js",
  "/pwa/offline.css",
  "/pwa/profile-crypto.js",
  "/pwa/icon-192.png",
  "/pwa/icon-512.png",
  "/pwa/apple-touch-icon.png",
];
const LOCALES = new Set([
  "en",
  "fa",
  "tr",
  "es",
  "ar",
  "ku",
  "de",
  "fr",
  "ru",
  "tg",
  "zh",
]);
const DIRECTORY_TTL = 7 * 24 * 60 * 60 * 1000;
let directoryWrites = Promise.resolve();

async function installShell() {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      await (await caches.open(SHELL_CACHE)).addAll(SHELL);
      return;
    } catch (error) {
      if (attempt === 2) throw error;
      // Critical static GETs are safe to retry. Cache.addAll remains atomic;
      // never activate a partially installed reader after a transient outage.
      await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
    }
  }
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      let previousPwa = false;
      for (const name of (await caches.keys()).filter((key) =>
        key.startsWith("lsevin-pwa-shell-")
      )) {
        if (
          await (
            await caches.open(name)
          ).match("/offline.html", { ignoreVary: true })
        )
          previousPwa = true;
      }
      await installShell();
      // The first PWA can replace the old push-only worker without reloading any
      // client. Subsequent PWA revisions retain the user's update choice.
      if (!previousPwa) await self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keep = new Set([
        SHELL_CACHE,
        ASSET_CACHE,
        DIRECTORY_CACHE,
        APPLICATION_CACHE,
        "lsevin-pwa-images-v2",
        "lsevin-pwa-private-view-v2",
        "lsevin-pwa-pages-v1",
      ]);
      await Promise.all(
        (await caches.keys())
          .filter((key) => key.startsWith("lsevin-pwa-") && !keep.has(key))
          .map((key) => caches.delete(key))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "PRIVATE_VIEW_CLEARED")
    event.waitUntil(
      (async () => {
        for (const client of await self.clients.matchAll({
          type: "window",
          includeUncontrolled: true,
        }))
          client.postMessage({ type: "PRIVATE_VIEW_CLEARED" });
      })()
    );
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
  if (event.data?.type === "REPAIR_SHELL")
    event.waitUntil(
      (async () => {
        const cache = await caches.open(SHELL_CACHE);
        if (!(await cache.match("/offline.html", { ignoreVary: true })))
          await cache.addAll(SHELL);
      })().catch(() => {})
    );
});

function storageUnavailable(request) {
  const locale = new URL(request.url).pathname.split("/")[1];
  const fa =
    locale === "fa" ||
    (!LOCALES.has(locale) && self.location.hostname.endsWith(".ir"));
  const title = fa
    ? "ذخیره‌سازی آفلاین در دسترس نیست"
    : "Offline storage unavailable";
  const message = fa
    ? "اطلاعات آفلاین پاک شده است. به اینترنت وصل شوید و دوباره تلاش کنید."
    : "Offline files were cleared. Reconnect and try again.";
  return new Response(
    `<!doctype html><html lang="${fa ? "fa" : "en"}" dir="${fa ? "rtl" : "ltr"}"><meta name="viewport" content="width=device-width,initial-scale=1"><title>LSevin</title><h1>${title}</h1><p>${message}</p><a href="">${fa ? "تلاش دوباره" : "Try again"}</a></html>`,
    {
      status: 503,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
        "Content-Security-Policy":
          "default-src 'none'; script-src 'none'; base-uri 'none'",
      },
    }
  );
}

async function offlineNavigation(request) {
  const pathname = new URL(request.url).pathname;
  const segments = pathname.split("/");
  const isReadingPage =
    pathname === "/" ||
    (LOCALES.has(segments[1]) &&
      /^\/(?:service-providers\/[a-zA-Z0-9-]+|type\/[a-zA-Z0-9-]+|n\/app\/mobile\/(?:home|providers|explore|categories|featured|search|search-results|profile|provider\/[a-zA-Z0-9-]+|specialist\/[a-zA-Z0-9-]+|service\/[a-zA-Z0-9-]+))?\/?$/.test(
        "/" + segments.slice(2).join("/")
      ));
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    // An HTTP-cached SSR page can otherwise look live while disconnected.
    // Always test the network, then restore the cached application document.
    const response = await fetch(request, {
      signal: controller.signal,
      cache: "no-store",
    });
    // Gateways can return an empty 5xx page even when the device reports online.
    // Preserve permission/not-found responses; document server failures can use
    // the saved reader. APIs and payment callbacks remain network-only.
    if (response.status >= 500 && isReadingPage) {
      controller.abort();
      throw new Error("NavigationServerUnavailable");
    }
    return response;
  } catch {
    try {
      if (isReadingPage) {
        const saved = await (
          await caches.open(APPLICATION_CACHE)
        ).match(pathname);
        if (
          saved &&
          Date.now() - Number(saved.headers.get("X-Lsevin-Saved-At")) < 86400000
        )
          return saved;
        if (
          /^\/(?:en|fa|tr|es|ar|ku|de|fr|ru|tg|zh)\/n\/app\/mobile\/profile\/?$/.test(
            pathname
          )
        ) {
          let html =
            (await LsevinViewStore.read(
              `/pwa/profile-projection/${segments[1]}`
            ).catch(() => null)) ||
            (await LsevinViewStore.read(pathname).catch(() => null));
          if (html?.startsWith("{")) {
            try {
              const projection = JSON.parse(html);
              html =
                projection.kind === "profile-v1" &&
                typeof projection.shell === "string" &&
                projection.shell.includes("data-pwa-profile-root")
                  ? projection.shell
                  : null;
            } catch {
              html = null;
            }
          }
          if (html)
            return new Response(html, {
              headers: {
                "Content-Type": "text/html; charset=utf-8",
                "Cache-Control": "no-store",
                "Content-Security-Policy":
                  "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'none'",
              },
            });
        }
        const locale = LOCALES.has(segments[1])
          ? segments[1]
          : self.location.hostname.endsWith(".ir")
            ? "fa"
            : "en";
        for (const fallback of [`/${locale}/n/app/mobile/home`, `/${locale}`]) {
          const page = await (
            await caches.open(APPLICATION_CACHE)
          ).match(fallback);
          if (
            fallback !== pathname &&
            page &&
            Date.now() - Number(page.headers.get("X-Lsevin-Saved-At")) <
              86400000
          ) {
            return Response.redirect(
              new URL(
                fallback +
                  (pathname === "/" || pathname === `/${locale}`
                    ? ""
                    : "?offlineUnavailable=1"),
                self.location.origin
              ).href,
              307
            );
          }
        }
      }
      const cached = await (
        await caches.open(SHELL_CACHE)
      ).match("/offline.html", { ignoreVary: true });
      if (cached) return cached;
    } catch {
      /* Storage can be evicted or disabled. */
    }
    return storageUnavailable(request);
  } finally {
    clearTimeout(timer);
  }
}

async function cachedAsset(request) {
  let cache;
  let cached;
  try {
    const shell = await caches.open(SHELL_CACHE);
    cache = await caches.open(ASSET_CACHE);
    cached =
      (await shell.match(new URL(request.url).pathname, {
        ignoreVary: true,
      })) || (await cache.match(request, { ignoreVary: true }));
  } catch {
    return { response: await fetch(request), saved: Promise.resolve() };
  }
  if (cached) return { response: cached, saved: Promise.resolve() };
  const response = await fetch(request);
  if (
    response.ok &&
    !response.redirected &&
    response.type === "basic" &&
    !(
      new URL(request.url).pathname.startsWith("/_next/static/") &&
      /text\/html/i.test(response.headers.get("content-type") || "")
    ) &&
    !/no-store|private/i.test(response.headers.get("cache-control") || "")
  ) {
    // Bound storage even when Content-Length is absent (compressed responses).
    const copy = response.clone();
    const storedResponse = response.clone();
    const saved = (async () => {
      try {
        const bytes = await copy.arrayBuffer();
        if (bytes.byteLength > 4 * 1024 * 1024) return;
        // A cache key must not persist an Authorization/Cookie header supplied
        // with a public asset request. These resources never vary by identity.
        const url = new URL(request.url);
        await cache.put(
          SHELL.includes(url.pathname) ? url.pathname : url.href,
          storedResponse
        );
        const keys = await cache.keys();
        // Bound the shared bootstrap cache across releases and visited routes.
        await Promise.all(
          keys
            .slice(0, Math.max(0, keys.length - 128))
            .map((key) => cache.delete(key))
        );
      } catch {
        /* A full/disabled cache must not break an online request. */
      }
    })();
    return { response, saved };
  }
  return { response, saved: Promise.resolve() };
}

function shortText(value, max) {
  return typeof value === "string" ? value.slice(0, max) : "";
}

async function saveDirectory(url, response) {
  // The existing providers catalogue is public and does not read the session.
  // Save a projection, never its raw response or any future added fields.
  if (
    !response.ok ||
    response.redirected ||
    !response.headers.get("content-type")?.includes("application/json")
  )
    return;
  const data = await response.json();
  if (!Array.isArray(data.items)) return;
  const locale = (url.searchParams.get("locale") || "fa").split("-")[0];
  if (!LOCALES.has(locale)) return;
  const cache = await caches.open(DIRECTORY_CACHE);
  const key = `/pwa/directory/${locale}`;
  const previous = await cache.match(key);
  const stored = previous ? await previous.json() : { items: [] };
  const now = Date.now();
  const items = new Map(
    stored.items
      .filter((item) => now - item.savedAt < DIRECTORY_TTL)
      .map((item) => [item.id, item])
  );
  for (const item of data.items.slice(0, 60)) {
    if (typeof item.id !== "string" || !/^[a-zA-Z0-9-]{1,100}$/.test(item.id))
      continue;
    // Descriptions can contain HTML. The offline reader displays them as text.
    items.delete(item.id);
    items.set(item.id, {
      id: item.id,
      name: shortText(item.name, 200),
      description: shortText(item.description, 3000),
      city: shortText(item.city, 200),
      country: shortText(item.country, 200),
      savedAt: now,
    });
  }
  await cache.put(
    key,
    new Response(JSON.stringify({ items: [...items.values()].slice(-60) }), {
      headers: { "Content-Type": "application/json" },
    })
  );
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method === "GET" && request.destination === "image") {
    event.respondWith(
      (async () => {
        const cached = await (
          await caches.open("lsevin-pwa-images-v2")
        ).match(url.href);
        return cached || fetch(request);
      })()
    );
    return;
  }
  if (
    url.origin === self.location.origin &&
    request.method === "POST" &&
    url.pathname === "/api/auth/signout"
  ) {
    event.waitUntil(LsevinViewStore.clear().catch(() => {}));
    return;
  }
  if (request.method !== "GET" || url.origin !== self.location.origin) return;
  // Financial host is a separate product and must remain network-only.
  if (url.hostname.startsWith("financial.")) return;
  if (request.mode === "navigate") {
    // Keep API/payment callbacks and downloads on the network. Their responses
    // must never be replaced with the offline HTML reader.
    const pagePath = LOCALES.has(url.pathname.split("/")[1])
      ? "/" + url.pathname.split("/").slice(2).join("/")
      : url.pathname;
    if (
      /^\/(api|files|uploads|media|_next|trpc)(\/|$)/.test(pagePath) ||
      (url.pathname !== "/offline.html" && /\.[^/]+$/.test(url.pathname))
    )
      return;
    if (url.pathname === "/offline.html") {
      // Use HTML from the active shell, matching its cached scripts while a
      // newer shell is installed and waiting for the user's update choice.
      const asset = cachedAsset(request);
      event.respondWith(
        asset
          .then((result) => result.response)
          .catch(() => storageUnavailable(request))
      );
      event.waitUntil(asset.then((result) => result.saved).catch(() => {}));
      return;
    }
  }
  if (request.mode === "navigate") {
    event.respondWith(offlineNavigation(request));
    return;
  }
  if (
    !url.search &&
    (SHELL.includes(url.pathname) || url.pathname.startsWith("/_next/static/"))
  ) {
    const asset = cachedAsset(request);
    event.respondWith(asset.then((result) => result.response));
    event.waitUntil(asset.then((result) => result.saved).catch(() => {}));
    return;
  }
  if (url.pathname === "/api/auth/session") {
    const network = fetch(request).then(async (response) => {
      if (response.ok) {
        const session = await response
          .clone()
          .json()
          .catch(() => undefined);
        if (session && typeof session === "object")
          await LsevinViewStore.checkOwner(
            session.error ? null : session.user?.id || null
          ).catch(() => {});
      }
      return response;
    });
    event.respondWith(network);
    return;
  }
  if (url.pathname === "/api/booking-pro/catalog/providers") {
    // The caller receives the live response. Snapshots are for the offline
    // reader only and can never be mistaken for live booking availability.
    // Clone before respondWith hands the response body to the browser, which
    // otherwise locks the stream before the snapshot task can read it.
    const network = fetch(request).then((response) => {
      const copy = response.clone();
      directoryWrites = directoryWrites
        .catch(() => {})
        .then(() => saveDirectory(url, copy));
      return { response, saved: directoryWrites };
    });
    event.respondWith(network.then((result) => result.response));
    event.waitUntil(network.then((result) => result.saved).catch(() => {}));
  }
});

self.addEventListener("push", (event) => {
  let data = { title: "LSevin", body: "" };
  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch {
    if (event.data) data.body = event.data.text();
  }

  event.waitUntil(
    self.registration.showNotification(data.title || "LSevin", {
      body: data.body || "",
      icon: "/favicon.ico",
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        for (const client of clients) {
          if ("focus" in client) return client.focus();
        }
        if (self.clients.openWindow) return self.clients.openWindow("/");
        return undefined;
      })
  );
});
