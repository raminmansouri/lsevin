/*
 * LSevin app-shell service worker (conservative).
 *
 * Goal: make repeat opens feel instant by serving the content-hashed build
 * assets (JS/CSS chunks, fonts, static images) from the Cache Storage instead
 * of the network — the single biggest lever for "native app" feel on return
 * visits.
 *
 * Safety constraints (deliberate):
 *  - Only GET requests are ever touched.
 *  - Only same-origin, immutable, content-hashed assets are cached
 *    (`/_next/static/`, `/fonts/`, `/images/`, `/icons/`).
 *  - Navigations, API calls (`/api/`), RSC/data payloads (`/_next/data`) and the
 *    image optimizer (`/_next/image`) are NEVER intercepted — they always hit
 *    the network, so dynamic content and auth can never be served stale.
 *  - Cache-first is safe here because these URLs are content-hashed: any change
 *    produces a new URL (cache miss → fresh fetch).
 *
 * To roll the cache (e.g. after changing this file), bump CACHE_VERSION.
 */
const CACHE_VERSION = "v1";
const CACHE = `lsevin-static-${CACHE_VERSION}`;

const CACHEABLE_PREFIXES = ["/_next/static/", "/fonts/", "/images/", "/icons/"];

self.addEventListener("install", () => {
  // Activate this SW as soon as it's installed; assets are cached lazily on use.
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // Remove caches from older versions of this SW.
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => k.startsWith("lsevin-static-") && k !== CACHE)
          .map((k) => caches.delete(k))
      );
      await self.clients.claim();
    })()
  );
});

function isCacheableAsset(url) {
  if (url.origin !== self.location.origin) return false;
  if (url.pathname.startsWith("/api/")) return false;
  if (url.pathname.startsWith("/_next/image")) return false;
  if (url.pathname.startsWith("/_next/data")) return false;
  return CACHEABLE_PREFIXES.some((p) => url.pathname.startsWith(p));
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return; // never touch mutations

  const url = new URL(req.url);
  if (!isCacheableAsset(url)) return; // passthrough: network owns this request

  event.respondWith(
    (async () => {
      const cached = await caches.match(req);
      if (cached) return cached;
      try {
        const res = await fetch(req);
        if (res && res.ok && res.status === 200 && res.type === "basic") {
          const cache = await caches.open(CACHE);
          cache.put(req, res.clone());
        }
        return res;
      } catch (err) {
        return cached || Response.error();
      }
    })()
  );
});
