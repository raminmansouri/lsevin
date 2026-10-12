// Cloudflare Worker for lsevincare.com - geo split with automatic failover.
//
// WHY THIS DESIGN
//  * Cloudflare's servers are outside Iran and server A (inside Iran) is NOT reachable from outside Iran, so a
//    Worker/proxy can never fetch from A. Pointing the proxied hostname (or the Worker's fetch) at A gives
//    Cloudflare error 522 for everybody.
//  * So: everybody is served from B through Cloudflare as usual. Visitors from Iran are REDIRECTED to a
//    DNS-only hostname that points straight at A (ir.lsevincare.com), so their browser connects to A inside Iran.
//  * The Worker cannot reach A to check its health, so A publishes a heartbeat into the synced media bucket;
//    the file sync copies it to B, and the Worker reads it from B (a public path the API already serves).
//    If the heartbeat is stale or A reports not-ok, Iranian visitors simply stay on B (automatic failover).
//
// SETUP (Cloudflare dashboard)
//  1. DNS: add  ir.lsevincare.com  A  213.176.121.235  with the proxy status "DNS only" (grey cloud) - kept as an alias that now forwards to lsevin.ir.
//  2. Workers & Routes: route  lsevincare.com/*  ->  this Worker. The proxied lsevincare.com record keeps
//     pointing at server B (202.133.90.50) as before; remove any route/record that targets A.
//  3. Worker variable IR_REDIRECT: off (default) | canary (only ?site=ir) | on (all Iranian page loads).
//     (optional) a Workers KV namespace bound as FLAGS with key  force_b = "1"  pushes everybody to B at once.
//
// Server A must serve ir.lsevincare.com with a publicly trusted certificate (see deployments/failover/README.md).

const A_HOST = "lsevin.ir";           // served by A behind the ArvanCloud edge (reachable from every Iranian operator)
const HEARTBEAT_URL = "https://api.lsevin.com/files/Categories/_health/a.json";
const HEARTBEAT_MAX_AGE_S = 180;      // A writes it every minute; 3 minutes of silence = A is considered down
const HEARTBEAT_CACHE_S = 30;         // how long this Worker caches the heartbeat

async function aIsAlive(ctx) {
  const cache = caches.default;
  const key = new Request("https://heartbeat.internal/a");
  let res = await cache.match(key);
  if (!res) {
    try {
      const r = await fetch(HEARTBEAT_URL, { cf: { cacheTtl: 0 }, signal: AbortSignal.timeout(2500) });
      const body = r.ok ? await r.json() : null;
      const alive = !!body && body.ok === true && (Date.now() / 1000 - Number(body.epoch)) < HEARTBEAT_MAX_AGE_S;
      res = new Response(JSON.stringify({ alive }), { headers: { "Cache-Control": `max-age=${HEARTBEAT_CACHE_S}` } });
    } catch (e) {
      // cannot read the heartbeat (B or the path unreachable): do NOT send people to A on a guess
      res = new Response(JSON.stringify({ alive: false }), { headers: { "Cache-Control": "max-age=10" } });
    }
    ctx.waitUntil(cache.put(key, res.clone()));
  }
  return (await res.json()).alive === true;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const country = request.cf && request.cf.country;

    // SAFETY SWITCH, variable IR_REDIRECT (Workers & Pages > lsevincare-geo > Settings > Variables):
    //   off    (default) everybody is served from B
    //   canary only visitors who add ?site=ir (or carry the cookie lsevin_site=ir) are sent to A - for testing
    //   on     every Iranian page load is sent to A while A is healthy
    const mode = env.IR_REDIRECT || "off";
    const optedIn = url.searchParams.get("site") === "ir" || (request.headers.get("Cookie") || "").includes("lsevin_site=ir");
    const redirectAllowed = mode === "on" || (mode === "canary" && optedIn);
    const forceB = !redirectAllowed || (env.FLAGS ? (await env.FLAGS.get("force_b")) === "1" : false);
    const wantsA = country === "IR" && !forceB
      && request.method === "GET"                       // only redirect navigations, never API writes
      && !url.pathname.startsWith("/api/") && !url.pathname.startsWith("/hubs/")
      && !url.pathname.startsWith("/_next/") && !url.pathname.startsWith("/files/");

    if (wantsA && request.headers.get("Accept")?.includes("text/html") && await aIsAlive(ctx)) {
      url.hostname = A_HOST;
      url.searchParams.delete("site");                   // the opt-in marker is not needed on A
      return Response.redirect(url.toString(), 302);     // 302, not 301: the decision is temporary
    }
    // everyone else (and Iran when A is down): normal path through Cloudflare to B
    return fetch(request);
  },
};
