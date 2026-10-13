// A real HTTP origin for worker/CacheStorage lifecycle tests. This exercises the
// production worker and reader; application/DB integration is a separate suite.
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const appRoot = fileURLToPath(new URL("../../", import.meta.url));
const publicRoot = resolve(appRoot, "public");
let version = 1;
let networkDisabled = false;
let shellFailures = 0;
let sessionOwner = "test-owner";
let assetActive = 0;
let assetPeak = 0;
let assetFailure = false;
let assetFailureHtml = false;
const mime = {
  ".js": "application/javascript",
  ".css": "text/css",
  ".html": "text/html",
  ".png": "image/png",
};
const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://127.0.0.1:4177");
    if (url.pathname === "/__fixture/assets") {
      if (url.searchParams.has("reset")) {
        assetActive = 0;
        assetPeak = 0;
        assetFailure = url.searchParams.has("failure");
        assetFailureHtml = url.searchParams.get("failure") === "html";
      }
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ active: assetActive, peak: assetPeak }));
      return;
    }
    if (/^\/_next\/static\/bounded-\d+\.js$/.test(url.pathname)) {
      assetActive++;
      assetPeak = Math.max(assetPeak, assetActive);
      await new Promise((resolve) => setTimeout(resolve, 80));
      assetActive--;
      res.setHeader("Content-Type", "application/javascript");
      res.setHeader("Cache-Control", "public,max-age=31536000,immutable");
      if (assetFailure && url.pathname.endsWith("-12.js")) {
        res.statusCode = assetFailureHtml ? 200 : 503;
        if (assetFailureHtml) res.setHeader("Content-Type", "text/html");
        res.end(assetFailureHtml ? "<html><h1>Gateway failure</h1></html>" : "");
      } else res.end("/* static application chunk */");
      return;
    }
    if (url.pathname === "/en/n/app/mobile/provider/bounded") {
      res.setHeader("Content-Type", "text/html");
      res.end(
        `<!doctype html><html><head>${Array.from({ length: assetFailure ? 13 : 12 }, (_, index) => `<script defer src="/_next/static/bounded-${index}.js"></script>`).join("")}</head><body><h1>Bounded downloads</h1></body></html>`
      );
      return;
    }
    if (url.pathname === "/__fixture/session") {
      sessionOwner = url.searchParams.get("owner") || "";
      res.end("OK");
      return;
    }
    if (url.pathname === "/__fixture/shell-failures") {
      shellFailures = Math.max(
        0,
        Math.min(3, Number(url.searchParams.get("count")) || 0)
      );
      res.end("OK");
      return;
    }
    if (url.pathname.endsWith("/specialist/http-cached"))
      res.setHeader("Cache-Control", "public, max-age=3600");
    if (
      url.pathname === "/__fixture/offline-on" ||
      url.pathname === "/__fixture/offline-off"
    ) {
      networkDisabled = url.pathname.endsWith("offline-on");
      res.end("OK");
      return;
    }
    if (networkDisabled) {
      req.socket.destroy();
      return;
    }
    if (url.pathname === "/api/auth/session") {
      res.setHeader("Content-Type", "application/json");
      if (url.searchParams.has("failure")) {
        res.statusCode = 503;
        res.end('{"error":"SessionUnavailable"}');
      } else
        res.end(
          JSON.stringify(sessionOwner ? { user: { id: sessionOwner } } : {})
        );
      return;
    }
    if (url.pathname === "/offline.html" && shellFailures > 0) {
      shellFailures -= 1;
      res.statusCode = 503;
      res.end();
      return;
    }
    if (
      ["/fixtures/application-cache.js", "/fixtures/profile-view.js"].includes(
        url.pathname
      )
    ) {
      const name = url.pathname.includes("application")
        ? "application-cache"
        : "profile-view";
      const source = (
        await readFile(resolve(appRoot, "src/lib/pwa/" + name + ".ts"), "utf8")
      ).replace('"./public-snapshot"', '"/fixtures/public-snapshot.js"');
      res.setHeader("Content-Type", "application/javascript");
      res.end(
        ts.transpileModule(source, {
          compilerOptions: {
            target: ts.ScriptTarget.ES2022,
            module: ts.ModuleKind.ES2022,
          },
        }).outputText
      );
      return;
    }
    if (url.pathname === "/_next/static/ui.css") {
      res.setHeader("Content-Type", "text/css");
      res.setHeader("Cache-Control", "public,max-age=31536000,immutable");
      res.end(
        "body{margin:0;background:#f5f6fb;font:16px Arial;color:#101e33}header{background:white;padding:24px;display:flex;gap:16px}main{padding:24px}.cards{display:grid;grid-template-columns:repeat(2,1fr);gap:16px}.card{background:white;border-radius:24px;padding:24px;border:1px solid #e5e7eb}img{width:64px;height:64px}nav{background:white;padding:20px;display:flex;gap:16px}button{padding:12px;border-radius:12px;background:#101e33;color:white;border:0}input{padding:12px;border-radius:12px;border:1px solid #ddd}footer{padding:24px}h1{font-size:24px}.fragment-example{clip-path:url(\\#clip)}.encoded-fragment{clip-path:url(%23clip)}"
      );
      return;
    }
    if (url.pathname === "/_next/static/ui.js") {
      res.setHeader("Content-Type", "application/javascript");
      res.setHeader("Cache-Control", "public,max-age=31536000,immutable");
      res.end(
        `document.documentElement.dataset.hydrated="true";document.querySelector('#services').onclick=()=>document.querySelector('#tab-content').textContent='Services and staff';document.querySelector('#search').oninput=e=>document.querySelectorAll('.card').forEach(c=>c.hidden=!c.textContent.toLowerCase().includes(e.target.value.toLowerCase()));`
      );
      return;
    }
    if (url.searchParams.has("projection")) {
      res.setHeader("Content-Type", "text/html");
      res.end(
        '<!doctype html><html lang="en"><head><title>Profile</title><link rel="stylesheet" href="/_next/static/ui.css"></head><body><header>LSevin</header><nav><a href="/en/n/app/mobile/home">Home</a></nav><main data-pwa-profile-overview data-pwa-profile-root></main></body></html>'
      );
      return;
    }
    if (
      url.searchParams.has("visual") ||
      req.headers["x-lsevin-public-snapshot"] === "1"
    ) {
      const privateText = req.headers.cookie
        ? "SIGNED_IN_SECRET"
        : "Public application";
      res.setHeader("Content-Type", "text/html");
      res.end(
        `<!doctype html><html lang="en"><head><title>Application view</title><link rel="stylesheet" href="/_next/static/ui.css"><script defer src="/_next/static/ui.js"></script></head><body><header><img src="/pwa/icon-192.png" alt="LSevin"><h1>${privateText}</h1></header><nav><a href="/en/n/app/mobile/home">Home</a><a href="/en/n/app/mobile/providers">Providers</a><a href="/en/n/app/mobile/specialist/visual">Staff</a><a href="/en/n/app/mobile/service/visual">Services</a></nav><main><input id="search" placeholder="Search"><div class="cards"><article class="card"><h2>Clinic One</h2><p>Provider and services</p><button id="services">Services</button><p id="tab-content">About the provider</p></article><article class="card"><h2>Clinic Two</h2><p>Staff information</p><button data-pwa-signout>Sign out</button></article></div></main><footer>LSevin</footer></body></html>`
      );
      return;
    }
    const documentStatus = new Map([
      ["/en/n/app/mobile/provider/server-error", 500],
      ["/en/n/app/mobile/provider/gateway-error", 503],
      ["/en/n/app/mobile/provider/forbidden", 403],
      ["/en/n/app/mobile/provider/not-found", 404],
    ]).get(url.pathname);
    if (documentStatus) {
      res.statusCode = documentStatus;
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.end(
        `<html><title>Origin failure</title><h1>Origin status ${documentStatus}</h1></html>`
      );
      return;
    }
    if (url.pathname.endsWith("-prefix")) {
      res.setHeader("Content-Type", "text/html");
      res.write(
        '<!doctype html><title>Slow provider</title><main><h1>Slow public provider</h1><p>Already available guest information.</p><script>window.snapshotExecuted = true; window.token = "MUST_NOT_SAVE";</script>'
      );
      await new Promise((done) => setTimeout(done, 1500));
      if (!res.destroyed) res.end("</main>");
      return;
    }
    if (url.pathname === "/__test/version") {
      version = Number(url.searchParams.get("value"));
      res.end("ok");
      return;
    }
    if (url.pathname === "/fixtures/public-snapshot.js") {
      const source = await readFile(
        resolve(appRoot, "src/lib/pwa/public-snapshot.ts"),
        "utf8"
      );
      res.setHeader("Content-Type", "application/javascript");
      res.end(
        ts.transpileModule(source, {
          compilerOptions: {
            target: ts.ScriptTarget.ES2022,
            module: ts.ModuleKind.ES2022,
          },
        }).outputText
      );
      return;
    }
    if (url.pathname === "/api/booking-pro/catalog/providers") {
      res.setHeader("Content-Type", "application/json");
      if (url.searchParams.has("fail")) {
        res.statusCode = 500;
        res.end('{"error":"InfrastructureError"}');
        return;
      }
      res.end(
        JSON.stringify({
          items: [
            {
              id: "test-clinic",
              name:
                url.searchParams.get("locale") === "fa"
                  ? "Ù…Ø±Ú©Ø² Ø¢Ø²Ù…Ø§ÛŒØ´ÛŒ"
                  : "Test Clinic",
              description: "<img src=x onerror=alert(1)> Public description",
              city: "Tehran",
              country: "Iran",
              secret: "MUST_NOT_CACHE",
              price: 123,
              accessToken: "MUST_NOT_CACHE",
            },
          ],
          total: 1,
          hasMore: false,
        })
      );
      return;
    }
    if (url.pathname === "/api/private") {
      res.setHeader("Content-Type", "application/json");
      res.end('{"medicalRecord":"MUST_NOT_CACHE"}');
      return;
    }
    if (url.pathname === "/server-failure") {
      res.statusCode = 500;
      res.end("Server failed");
      return;
    }
    if (url.pathname.startsWith("/_next/static/")) {
      res.setHeader("Content-Type", "application/javascript");
      res.setHeader(
        "Cache-Control",
        url.pathname.includes("private")
          ? "private, no-store"
          : "public, max-age=31536000, immutable"
      );
      res.end("window.pwaAssetLoaded = true;");
      return;
    }
    if (url.pathname === "/slow")
      await new Promise((done) => setTimeout(done, 12000));
    if (
      url.pathname === "/sw.js" ||
      url.pathname === "/offline.html" ||
      url.pathname.startsWith("/pwa/")
    ) {
      const file = resolve(publicRoot, "." + url.pathname);
      if (!file.startsWith(publicRoot + sep)) {
        res.statusCode = 403;
        res.end();
        return;
      }
      let data = await readFile(file);
      res.setHeader(
        "Content-Type",
        mime[file.slice(file.lastIndexOf("."))] || "application/octet-stream"
      );
      res.setHeader("Cache-Control", "no-cache");
      if (url.pathname !== "/sw.js")
        res.setHeader("Vary", "Accept-Language, Accept-Encoding");
      if (url.pathname === "/offline.html")
        data = data
          .toString()
          .replace("<main>", `<main data-shell-version="${version}">`);
      if (url.pathname === "/sw.js")
        data = data
          .toString()
          .replace(
            /const VERSION = "[^"]+";/,
            `const VERSION = "v${version}";`
          );
      res.end(data);
      return;
    }
    res.setHeader("Content-Type", "text/html");
    res.end(
      `<!doctype html><html lang="en"><head><title>Public fixture page</title></head><body><main><h1>Public provider information</h1><p>Guest information about staff and services.</p><form><input value="DO_NOT_SAVE"></form></main><div hidden id="S:1"><p>Streamed public service details.</p></div><script>window.sessionToken="DO_NOT_SAVE"; window.onunhandledrejection=e=>{window.pwaFixtureError=String(e.reason)}; window.onerror=(m)=>{window.pwaFixtureError=m}</script><button id="save" disabled>Save page</button><script type="module">import {savePublicPage} from '/fixtures/public-snapshot.js'; document.querySelector('#save').onclick=async()=>{ await savePublicPage(location.pathname,new AbortController().signal); document.querySelector('#save').textContent='Saved'; }; document.querySelector('#save').disabled=false; await navigator.serviceWorker.register('/sw.js'); await navigator.serviceWorker.ready;</script></body></html>`
    );
  } catch {
    res.statusCode = 404;
    res.end("Not found");
  }
});
server.listen(Number(process.env.PWA_FIXTURE_PORT || 4177), "127.0.0.1", () =>
  console.log("PWA fixture origin listening")
);
