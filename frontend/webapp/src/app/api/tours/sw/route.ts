/**
 * Tours service worker (AT-29, S-040). Registered by the voucher page with the
 * scope `/{locale}/tours/` (allowed by the Service-Worker-Allowed header).
 *
 * Network-first for page navigations only — nothing is served from cache while
 * online. When a voucher page cannot be fetched, it renders the copy the page
 * saved on this device (Cache API, see ui/customer/bookings/offline.ts),
 * clearly labelled as offline. Every other request goes straight to the network.
 */
const SCRIPT = String.raw`
const CACHE = "lsevin-tours-offline-v1";
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

function render(v) {
  const L = v.labels || {};
  const qr = v.qr && /^[MhvzZ0-9 .-]+$/.test(v.qr.d) && Number.isFinite(v.qr.viewBox)
    ? '<svg role="img" aria-label="' + esc(L.qr) + '" width="180" height="180" viewBox="0 0 ' + v.qr.viewBox + ' ' + v.qr.viewBox + '" shape-rendering="crispEdges"><rect width="100%" height="100%" fill="#fff"/><path d="' + v.qr.d + '" fill="#000"/></svg>'
    : "";
  const attendees = (v.attendees || []).map((a) => "<li><bdi>" + esc(a) + "</bdi></li>").join("");
  return '<!doctype html><html lang="' + esc(v.lang) + '" dir="' + (v.dir === "rtl" ? "rtl" : "ltr") + '"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<title>' + esc(v.title) + '</title><style>body{font-family:system-ui,Tahoma,sans-serif;margin:0;background:#f8fafc;color:#0f172a}main{max-width:560px;margin:0 auto;padding:16px}' +
    '.banner{background:#fef3c7;color:#78350f;border-radius:12px;padding:12px;font-size:14px}.card{background:#fff;border-radius:16px;padding:16px;margin-top:12px;box-shadow:0 0 0 1px #e2e8f0}' +
    'h1{font-size:20px;margin:12px 0 4px}h2{font-size:14px;margin:0 0 6px;color:#334155}p{margin:4px 0;line-height:1.6}.code{font-size:22px;font-weight:800;letter-spacing:1px}</style></head><body><main data-testid="offline-voucher">' +
    '<p class="banner" role="status" data-testid="offline-banner">' + esc(L.banner) + '</p>' +
    '<h1>' + esc(v.title) + '</h1>' +
    '<div class="card"><h2>' + esc(L.voucherCode) + '</h2><p class="code" dir="ltr"><bdi dir="ltr">' + esc(v.voucherCode) + '</bdi></p>' + qr + '</div>' +
    '<div class="card"><h2>' + esc(L.departure) + '</h2><p>' + esc(v.departure) + '</p><p>' + esc(L.timezone) + '</p></div>' +
    '<div class="card" data-testid="offline-meeting"><h2>' + esc(L.meetingPoint) + '</h2>' + (v.meetingText ? '<p>' + esc(v.meetingText) + '</p>' : '') + (v.meetingCoords ? '<p dir="ltr"><bdi dir="ltr">' + esc(v.meetingCoords) + '</bdi></p>' : '') + '</div>' +
    (attendees ? '<div class="card"><h2>' + esc(L.attendees) + '</h2><ul>' + attendees + '</ul></div>' : '') +
    '<p class="card">' + esc(L.liveUnavailable) + '</p></main></body></html>';
}

const OFFLINE = '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Offline</title></head><body style="font-family:system-ui,sans-serif;padding:24px"><p>You are offline. / شما آفلاین هستید.</p></body></html>';

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET" || req.mode !== "navigate") return;
  event.respondWith((async () => {
    try {
      return await fetch(req);
    } catch (err) {
      const m = new URL(req.url).pathname.match(/^\/[a-z]{2}\/tours\/bookings\/([0-9a-f-]{36})\/?$/i);
      if (m) {
        try {
          const cache = await caches.open(CACHE);
          const hit = await cache.match("/__tours_offline/voucher/" + m[1].toLowerCase());
          if (hit) return new Response(render(await hit.json()), { headers: { "Content-Type": "text/html; charset=utf-8" } });
        } catch (e) {}
      }
      return new Response(OFFLINE, { status: 503, headers: { "Content-Type": "text/html; charset=utf-8" } });
    }
  })());
});
`;

export function GET() {
  return new Response(SCRIPT, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Service-Worker-Allowed": "/",
      "Cache-Control": "no-cache",
    },
  });
}
