// Logic test for cloudflare-worker.js with the Cloudflare runtime mocked.  Run:  node worker.test.mjs
import worker from "./cloudflare-worker.js";

let failures = 0;
const results = [];
function check(name, cond, extra = "") { results.push(`${cond ? "PASS" : "FAIL"}  ${name}${extra ? "  " + extra : ""}`); if (!cond) failures++; }

// --- runtime mocks
const store = new Map();
globalThis.caches = { default: {
  async match(req) { const r = store.get(req.url); return r ? r.clone() : undefined; },
  async put(req, res) { store.set(req.url, res); },
} };
let heartbeat = null;          // what the (mocked) B returns for the heartbeat URL
let passThroughCalls = [];
globalThis.fetch = async (input) => {
  const url = typeof input === "string" ? input : input.url;
  if (url.includes("/files/Categories/_health/a.json")) {
    if (heartbeat === "throw") throw new Error("network");
    if (heartbeat === null) return new Response("nope", { status: 404 });
    return new Response(JSON.stringify(heartbeat), { status: 200 });
  }
  passThroughCalls.push(url);
  return new Response("from B", { status: 200 });
};
const ctx = { waitUntil() {} };
const now = () => Math.floor(Date.now() / 1000);
function req(path, { country = "IR", method = "GET", accept = "text/html" } = {}) {
  const r = new Request("https://lsevincare.com" + path, { method, headers: { Accept: accept } });
  Object.defineProperty(r, "cf", { value: { country } });
  return r;
}
async function run(r, env) { store.clear(); passThroughCalls = []; return worker.fetch(r, env, ctx); }
const ON = { IR_REDIRECT: "on" };

// 1. switch off -> never redirects
heartbeat = { ok: true, epoch: now() };
let res = await run(req("/"), { IR_REDIRECT: "off" });
check("redirect OFF: Iranian visitor stays on B", res.status === 200 && passThroughCalls.length === 1);
res = await run(req("/"), {});
check("variable missing: behaves as OFF", res.status === 200);

// 2. switch on, Iran, healthy A -> 302 to the Iran host, path+query preserved
res = await run(req("/en/n/app/mobile/home?cityCode=TEHRAN"), ON);
check("ON + Iran + A healthy: 302 redirect", res.status === 302);
check("redirect keeps path and query", res.headers.get("Location") === "https://lsevin.ir/en/n/app/mobile/home?cityCode=TEHRAN", res.headers.get("Location"));

// 3. failover cases -> stay on B
heartbeat = { ok: true, epoch: now() - 600 };
res = await run(req("/"), ON);
check("heartbeat older than 3 min: stays on B", res.status === 200);
heartbeat = { ok: false, epoch: now() };
res = await run(req("/"), ON);
check("A reports ok:false: stays on B", res.status === 200);
heartbeat = null;
res = await run(req("/"), ON);
check("heartbeat missing (404): stays on B", res.status === 200);
heartbeat = "throw";
res = await run(req("/"), ON);
check("heartbeat unreadable (network error): stays on B", res.status === 200);

// 4. never redirect these
heartbeat = { ok: true, epoch: now() };
check("non-Iranian visitor stays on B", (await run(req("/", { country: "TR" }), ON)).status === 200);
check("unknown country stays on B", (await run(req("/", { country: null }), ON)).status === 200);
check("POST is never redirected", (await run(req("/", { method: "POST" }), ON)).status === 200);
check("API path is never redirected", (await run(req("/api/v1/x"), ON)).status === 200);
check("hubs path is never redirected", (await run(req("/hubs/chat"), ON)).status === 200);
check("static assets are never redirected", (await run(req("/_next/static/a.js"), ON)).status === 200);
check("files are never redirected", (await run(req("/files/Categories/x.jpg"), ON)).status === 200);
check("non-HTML requests (fetch/XHR) are not redirected", (await run(req("/", { accept: "application/json" }), ON)).status === 200);

// 4b. canary mode: only opted-in visitors are redirected
const CAN = { IR_REDIRECT: "canary" };
check("canary: normal Iranian visitor stays on B", (await run(req("/"), CAN)).status === 200);
res = await run(req("/en/home?site=ir&x=1"), CAN);
check("canary: ?site=ir is redirected to A and the marker is removed", res.status === 302 && res.headers.get("Location") === "https://lsevin.ir/en/home?x=1", res.headers.get("Location"));
{ const r = new Request("https://lsevincare.com/", { headers: { Accept: "text/html", Cookie: "a=b; lsevin_site=ir" } }); Object.defineProperty(r, "cf", { value: { country: "IR" } });
  store.clear(); const x = await worker.fetch(r, CAN, ctx); check("canary: cookie lsevin_site=ir is redirected", x.status === 302); }
check("canary: opted-in but stale heartbeat stays on B", (heartbeat = { ok: true, epoch: now() - 900 }, (await run(req("/?site=ir"), CAN)).status === 200));
heartbeat = { ok: true, epoch: now() };
check("canary: non-Iranian with ?site=ir stays on B", (await run(req("/?site=ir", { country: "TR" }), CAN)).status === 200);

// 5. KV kill switch
const kv = { async get(k) { return k === "force_b" ? "1" : null; } };
check("KV force_b=1 sends everybody to B even when ON", (await run(req("/"), { ...ON, FLAGS: kv })).status === 200);

console.log(results.join("\n"));
console.log(failures === 0 ? `\nALL ${results.length} PASS` : `\n${failures} FAILED`);
process.exit(failures === 0 ? 0 : 1);
