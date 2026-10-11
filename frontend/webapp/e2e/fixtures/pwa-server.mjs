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
const mime = {
  ".js": "application/javascript",
  ".css": "text/css",
  ".html": "text/html",
  ".png": "image/png",
};
const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://127.0.0.1:4177");
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
    if (url.pathname === "/offline.html" && shellFailures > 0) {
      shellFailures -= 1;
      res.statusCode = 503;
      res.end();
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
server.listen(4177, "127.0.0.1", () =>
  console.log("PWA fixture origin listening on 4177")
);
