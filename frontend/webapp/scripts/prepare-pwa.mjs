import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

// A small React entry renders the same profile component without persisting
// Next's authenticated bootstrap, session payload or server-action references.
await build({
  entryPoints: [
    fileURLToPath(new URL("../src/lib/pwa/profile-app.tsx", import.meta.url)),
  ],
  outfile: fileURLToPath(
    new URL("../public/pwa/profile-app.js", import.meta.url)
  ),
  bundle: true,
  minify: true,
  format: "iife",
  platform: "browser",
  jsx: "automatic",
  target: ["es2020"],
  define: { "process.env.NODE_ENV": '"production"' },
});

// Give every worker/shell revision its own atomic cache. Unchanged builds keep
// the same cache and do not trigger an unnecessary update prompt.
const publicRoot = new URL("../public/", import.meta.url);
const workerURL = new URL("sw.js", publicRoot);
let worker = await readFile(workerURL, "utf8");
// Bundle the shared store into the worker: installation must not depend on a
// second unprotected importScripts request succeeding through a flaky gateway.
const viewStore = await readFile(
  new URL("pwa/view-store.js", publicRoot),
  "utf8"
);
const bundledStore = `/* PROFILE_VIEW_STORE_START */\n${viewStore}\n/* PROFILE_VIEW_STORE_END */`;
worker = worker
  .replace(
    /\/\* PROFILE_VIEW_STORE_START \*\/[\s\S]*?\/\* PROFILE_VIEW_STORE_END \*\//,
    bundledStore
  )
  .replace('importScripts("/pwa/view-store.js");', bundledStore);
const versionPattern = /const VERSION = "[^"]+";/;
if (!versionPattern.test(worker))
  throw new Error("PWA worker version marker is missing.");
const hash = createHash("sha256");
hash.update(worker.replace(versionPattern, 'const VERSION = "generated";'));
for (const path of [
  "offline.html",
  "pwa/offline.js",
  "pwa/view-store.js",
  "pwa/live-view.js",
  "pwa/profile-app.js",
  "pwa/offline.css",
  "pwa/profile-crypto.js",
  "pwa/icon-192.png",
  "pwa/icon-512.png",
  "pwa/apple-touch-icon.png",
]) {
  hash.update(path);
  hash.update(await readFile(new URL(path, publicRoot)));
}
const version = `v1-${hash.digest("hex").slice(0, 16)}`;
const prepared = worker.replace(
  versionPattern,
  `const VERSION = "${version}";`
);
if (prepared !== worker) await writeFile(workerURL, prepared);
console.log(`PWA cache revision: ${version}`);
